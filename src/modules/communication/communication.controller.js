import CommunicationSession from '../../models/CommunicationSession.js';
import { sendResponse } from '../../utils/response.js';
import pkg from 'agora-access-token';

const { RtcTokenBuilder, RtcRole } = pkg;

export const createSession = async (req, res) => {
  const { appointmentId, type } = req.body;
  try {
    const session = await CommunicationSession.create({
      appointmentId,
      type,
      userIds: [req.user._id], // Should include doctor later
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });
    return sendResponse(res, 201, 'Session created', session);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};

export const getSessionByAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  try {
    const session = await CommunicationSession.findOne({ appointmentId, status: 'active' });
    if (!session) return sendResponse(res, 404, 'No active session found');
    return sendResponse(res, 200, 'Session found', session);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const closeSession = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const session = await CommunicationSession.findByIdAndUpdate(sessionId, { status: 'closed' }, { new: true });
    return sendResponse(res, 200, 'Session closed', null);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};

export const getCallToken = async (req, res) => {
  const { appointmentId } = req.params;
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appointmentId) {
    return sendResponse(res, 400, 'Appointment ID is required');
  }

  try {
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Use appointmentId as the channel name
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      appointmentId,
      0, // uid 0
      role,
      privilegeExpiredTs
    );

    return sendResponse(res, 200, 'Token generated', { 
      token, 
      channelName: appointmentId,
      appId 
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};
