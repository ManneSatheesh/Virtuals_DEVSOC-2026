import logging
import os
import json
import asyncio
import httpx
from dotenv import load_dotenv

from livekit import agents, api
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import (
    google,
    cartesia,
    deepgram,
    noise_cancellation,
    silero,
)
from livekit.agents import llm
from typing import Annotated, Optional

# Load environment variables
load_dotenv(".env")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("outbound-agent")

# Backboard API for memory
BACKBOARD_URL = os.getenv("BACKBOARD_URL", "http://localhost:3000")

# Emotion detection API
EMOTION_TEXT_API_URL = os.getenv("EMOTION_TEXT_API_URL", "http://localhost:8000/predict-text")


# TRUNK ID - This needs to be set after you create your trunk
# You can find this by running 'python setup_trunk.py --list' or checking LiveKit Dashboard
OUTBOUND_TRUNK_ID = os.getenv("OUTBOUND_TRUNK_ID")
SIP_DOMAIN = os.getenv("VOBIZ_SIP_DOMAIN") 


def _build_tts():
    """Configure the Text-to-Speech provider based on env vars."""
    provider = os.getenv("TTS_PROVIDER", "deepgram").lower()
    
    if provider == "cartesia":
        logger.info("Using Cartesia TTS")
        model = os.getenv("CARTESIA_TTS_MODEL", "sonic-2")
        voice = os.getenv("CARTESIA_TTS_VOICE", "f786b574-daa5-4673-aa0c-cbe3e8534c02")
        return cartesia.TTS(model=model, voice=voice)
    
    if provider == "google":
        logger.info("Using Google Gemini TTS")
        api_key = os.getenv("GOOGLE_API_KEY")
        return google.beta.GeminiTTS(api_key=api_key)
    
    # Default to Deepgram TTS (more reliable, no strict rate limits)
    logger.info("Using Deepgram TTS")
    # Use aura model with sample_rate optimized for telephony (8kHz)
    return deepgram.TTS(
        model="aura-asteria-en",  # Fast, natural voice
        sample_rate=8000,  # Telephony standard
    )



class TransferFunctions(llm.ToolContext):
    def __init__(self, ctx: agents.JobContext, phone_number: str = None):
        super().__init__(tools=[])
        self.ctx = ctx
        self.phone_number = phone_number

    @llm.function_tool(description="Transfer the call to a human support agent or another phone number.")
    async def transfer_call(self, destination: Optional[str] = None):
        """
        Transfer the call.
        """
        if destination is None:
            destination = os.getenv("DEFAULT_TRANSFER_NUMBER")
            if not destination:
                 return "Error: No default transfer number configured."
        if "@" not in destination:
            # If no domain is provided, append the SIP domain
            if SIP_DOMAIN:
                # Ensure clean number (strip tel: or sip: prefix if present but no domain)
                clean_dest = destination.replace("tel:", "").replace("sip:", "")
                destination = f"sip:{clean_dest}@{SIP_DOMAIN}"
            else:
                # Fallback to tel URI if no domain configured
                if not destination.startswith("tel:") and not destination.startswith("sip:"):
                     destination = f"tel:{destination}"
        elif not destination.startswith("sip:"):
             destination = f"sip:{destination}"
        
        logger.info(f"Transferring call to {destination}")
        
        # Determine the participant identity
        # For outbound calls initiated by this agent, the participant identity is typically "sip_<phone_number>"
        # For inbound, we might need to find the remote participant.
        participant_identity = None
        
        # If we stored the phone number from metadata, we can construct the identity
        if self.phone_number:
            participant_identity = f"sip_{self.phone_number}"
        else:
            # Try to find a participant that is NOT the agent
            for p in self.ctx.room.remote_participants.values():
                participant_identity = p.identity
                break
        
        if not participant_identity:
            logger.error("Could not determine participant identity for transfer")
            return "Failed to transfer: could not identify the caller."

        try:
            logger.info(f"Transferring participant {participant_identity} to {destination}")
            await self.ctx.api.sip.transfer_sip_participant(
                api.TransferSIPParticipantRequest(
                    room_name=self.ctx.room.name,
                    participant_identity=participant_identity,
                    transfer_to=destination,
                    play_dialtone=False
                )
            )
            return "Transfer initiated successfully."
        except Exception as e:
            logger.error(f"Transfer failed: {e}")
            return f"Error executing transfer: {e}"


class OutboundAssistant(Agent):

    """
    An AI agent tailored for outbound calls.
    Personalized based on user profile and emotion-aware.
    """
    def __init__(self, user_context: str = "") -> None:
        base_instructions = """
            You are a warm, empathetic voice assistant from MindfulVoice, providing personalized mental wellness support over the phone.
            
            CORE BEHAVIORS:
            1. Greet warmly and introduce yourself briefly when the call connects.
            2. Be conversational, supportive, and genuinely caring.
            3. Keep responses concise (under 50 words) - this is a phone call, not a lecture.
            4. Adjust your tone based on how the user sounds and what they say.
            5. If they sound sad or stressed, be extra gentle and supportive.
            6. If they sound happy, match their positive energy.
            
            PERSONALIZATION:
            - Use their name if you know it.
            - Reference their profile information naturally when relevant.
            - Remember their age group and adjust your language accordingly.
            - For elderly users, speak clearly and be patient.
            - For younger users, be more casual and relatable.
            
            IMPORTANT:
            - Never mention you're detecting emotions or reading their profile.
            - If the user wants to end the call, say goodbye warmly.
            - If transfer is requested, use the transfer_call tool immediately.
            """
        
        # Add user context if available
        if user_context:
            full_instructions = f"{base_instructions}\n\nUSER CONTEXT:\n{user_context}"
        else:
            full_instructions = base_instructions
            
        super().__init__(instructions=full_instructions)


async def fetch_user_memory() -> dict:
    """Fetch user profile and memory from Backboard."""
    result = {"memory": "", "reminders": [], "name": ""}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{BACKBOARD_URL}/recall-memory",
                json={},
                timeout=10.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                result["memory"] = data.get("memory", "")
                result["reminders"] = data.get("reminders", [])
                result["name"] = data.get("name", "")
                logger.info(f"✅ Loaded user data from Backboard")
    except Exception as e:
        logger.warning(f"Could not fetch user memory: {e}")
    return result


async def fetch_reminders() -> list:
    """Fetch reminders/tips for the user."""
    # Default wellness reminders if none from backend
    default_reminders = [
        "Remember to take a few deep breaths today",
        "Don't forget to drink water and stay hydrated",
        "A short walk can do wonders for your mood",
    ]
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BACKBOARD_URL}/api/reminders",
                timeout=5.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                reminders = data.get("reminders", [])
                if reminders:
                    logger.info(f"✅ Loaded {len(reminders)} reminders")
                    return reminders
    except Exception as e:
        logger.warning(f"Could not fetch reminders: {e}")
    return default_reminders


async def analyze_text_emotion(text: str) -> str:
    """Analyze text for emotion."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                EMOTION_TEXT_API_URL,
                json={"text": text},
                timeout=5.0,
            )
            if resp.status_code == 200:
                result = resp.json()
                label = result.get("label", "neutral")
                score = result.get("score", 0)
                logger.info(f"🎭 Emotion detected: {label} ({score:.0%})")
                return label
    except Exception as e:
        logger.warning(f"Emotion detection failed: {e}")
    return "neutral"


async def entrypoint(ctx: agents.JobContext):
    """
    Main entrypoint for the agent.
    
    For outbound calls:
    1. Fetches user profile/memory from Backboard
    2. Checks for 'phone_number' in the job metadata.
    3. Connects to the room.
    4. Initiates the SIP call to the phone number.
    5. Waits for answer before speaking with personalized greeting.
    """
    logger.info(f"Connecting to room: {ctx.room.name}")
    
    # Fetch user memory/profile and reminders from Backboard
    logger.info("🧠 Fetching user data from Backboard...")
    user_data = await fetch_user_memory()
    reminders = await fetch_reminders()
    
    user_context = user_data.get("memory", "")
    user_name = user_data.get("name", "")
    
    # Try to extract name from memory if not directly available
    if not user_name and user_context:
        if "name is" in user_context.lower():
            try:
                name_part = user_context.lower().split("name is")[1].split()[0].strip(".,!?")
                user_name = name_part.capitalize()
            except:
                pass
    
    # parse the phone number from the metadata sent by the dispatch script
    phone_number = None
    try:
        if ctx.job.metadata:
            data = json.loads(ctx.job.metadata)
            phone_number = data.get("phone_number")
    except Exception:
        logger.warning("No valid JSON metadata found. This might be an inbound call.")

    # Initialize function context
    fnc_ctx = TransferFunctions(ctx, phone_number)

    # Initialize the Agent Session with plugins
    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=google.LLM(model="gemini-2.5-flash"),
        tts=_build_tts(),
        tools=fnc_ctx._tools,
    )

    # Start the session with personalized agent
    await session.start(
        room=ctx.room,
        agent=OutboundAssistant(user_context=user_context),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVCTelephony(),
            close_on_disconnect=True,
        ),
    )

    if phone_number:
        logger.info(f"Initiating outbound SIP call to {phone_number}...")
        try:
            # Create a SIP participant to dial out
            # This effectively "calls" the phone number and brings them into this room
            await ctx.api.sip.create_sip_participant(
                api.CreateSIPParticipantRequest(
                    room_name=ctx.room.name,
                    sip_trunk_id=OUTBOUND_TRUNK_ID,
                    sip_call_to=phone_number,
                    participant_identity=f"sip_{phone_number}", # Unique ID for the SIP user
                    wait_until_answered=True, # Important: Wait for pickup before continuing
                )
            )
            logger.info("Call answered! Speaking now...")
            
            # Small delay to ensure audio path is established
            await asyncio.sleep(0.5)
            
            # Build personalized one-way message with reminders
            reminder_text = ""
            if reminders:
                if len(reminders) == 1:
                    reminder_text = f" I have a quick reminder for you: {reminders[0]}."
                else:
                    reminder_text = f" I have {len(reminders)} reminders for you. First, {reminders[0]}. Second, {reminders[1]}."
                    if len(reminders) > 2:
                        reminder_text += f" And lastly, {reminders[2]}."
            
            if user_name:
                message = f"""Speak this message warmly and clearly:
                'Hi {user_name}! This is your MindfulVoice wellness assistant.
                I'm calling with your daily check-in.{reminder_text}
                Take care of yourself today, and remember - you're doing great!
                If you ever need to talk, I'm always here for you.
                Have a wonderful day! Goodbye!'
                """
            else:
                message = f"""Speak this message warmly and clearly:
                'Hello! This is your MindfulVoice wellness assistant.
                I'm calling with your daily check-in.{reminder_text}
                Take care of yourself today, and remember - you're doing great!
                If you ever need to talk, I'm always here for you.
                Have a wonderful day! Goodbye!'
                """
            
            # Deliver the one-way message
            logger.info(f"📢 Delivering reminder message (user: {user_name or 'unknown'})...")
            await session.generate_reply(instructions=message)
            logger.info("✅ Message delivered!")
            
            # Wait a moment then end the call
            await asyncio.sleep(2)
            logger.info("📞 Ending call...")
            
            # Disconnect the SIP participant to end call
            try:
                await ctx.api.room.remove_participant(
                    api.RoomParticipantIdentity(
                        room=ctx.room.name,
                        identity=f"sip_{phone_number}",
                    )
                )
            except Exception as disconnect_err:
                logger.warning(f"Could not disconnect SIP: {disconnect_err}")
            
            ctx.shutdown()
            
        except Exception as e:
            logger.error(f"Failed to place outbound call: {e}")
            ctx.shutdown()
    else:
        # Fallback for inbound calls
        logger.info("No phone number in metadata. Treating as inbound/web call.")
        await session.generate_reply(instructions="Greet the user and let them know this is a wellness check-in call.")


if __name__ == "__main__":
    # The agent name "outbound-caller" is used by the dispatch script to find this worker
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="outbound-caller", 
        )
    )
