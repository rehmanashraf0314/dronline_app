const axios = require('axios');

const DAILY_BASE = 'https://api.daily.co/v1';

// Build headers dynamically so env vars are loaded first
const getHeaders = () => ({
  Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
  'Content-Type': 'application/json',
});

// Create a meeting room for an appointment
exports.createMeetingRoom = async (appointmentId) => {
  // Sanitize the appointmentId to ensure no invalid characters break the API request
  const sanitizedId = String(appointmentId).replace(/[^a-zA-Z0-9-_]/g, '');
  const roomName = `dronline-${sanitizedId}`;
  const headers = getHeaders();

  console.log(`Creating Daily.co room: ${roomName}`);

  try {
    const response = await axios.post(
      `${DAILY_BASE}/rooms`,
      {
        name: roomName,
        privacy: 'private',
        properties: {
          enable_chat: true,
          enable_knocking: false,
          max_participants: 2,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24-hour expiration
        },
      },
      { headers }
    );

    const room = response.data;
    
    // SAFE: Use the direct URL returned by Daily instead of relying on manually appended env variables
    const meetingLink = room.url; 

    console.log(`✅ Daily.co room created: ${meetingLink}`);

    return {
      meetingId: room.id,
      meetingCode: room.name,
      meetingLink,
    };
  } catch (err) {
    console.error('❌ Daily.co room creation failed:', err.response?.data || err.message);
    throw new Error(`Failed to create video room: ${err.message}`);
  }
};

// Create a meeting token for doctor or patient
exports.createMeetingToken = async ({ roomName, participantName, isOwner = false }) => {
  try {
    const headers = getHeaders();

    const response = await axios.post(
      `${DAILY_BASE}/meeting-tokens`,
      {
        properties: {
          room_name: roomName,
          user_name: participantName,
          is_owner: isOwner,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
      },
      { headers }
    );
    return response.data.token;
  } catch (err) {
    console.error('❌ Daily.co token generation failed:', err.response?.data || err.message);
    throw err;
  }
};

exports.deleteRoom = async (roomName) => {
  try {
    const headers = getHeaders();
    await axios.delete(`${DAILY_BASE}/rooms/${roomName}`, { headers });
    console.log(`🗑️ Daily.co room deleted: ${roomName}`);
  } catch (err) {
    console.error('❌ Daily room delete failed:', err.response?.data || err.message);
  }
};