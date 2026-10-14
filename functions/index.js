const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const logger = require("firebase-functions/logger");
const { onSchedule } = require("firebase-functions/v2/scheduler");

initializeApp();

const ROOM_INACTIVITY_MS = 2 * 60 * 1000;

function hasConnectedPlayers(room) {
    return Object.values(room.presence || {}).some((connected) => connected === true);
}

function isInactive(room, now) {
    const lastActiveAt = Number(room.lastActiveAt || room.createdAt);
    return Number.isFinite(lastActiveAt)
        && lastActiveAt <= now - ROOM_INACTIVITY_MS
        && !hasConnectedPlayers(room);
}

exports.cleanupEmptyClassroomRooms = onSchedule({
    schedule: "every 5 minutes",
    timeZone: "Etc/UTC",
    maxInstances: 1
}, async () => {
    const database = getDatabase();
    const roomsRef = database.ref("classroomRooms");
    const roomsSnapshot = await roomsRef.get();
    const inactiveRoomCodes = [];
    const now = Date.now();

    roomsSnapshot.forEach((roomSnapshot) => {
        const room = roomSnapshot.val();
        if (room && isInactive(room, now)) inactiveRoomCodes.push(roomSnapshot.key);
    });

    let deletedCount = 0;
    for (const roomCode of inactiveRoomCodes) {
        const result = await roomsRef.child(roomCode).transaction((room) => {
            if (!room || !isInactive(room, Date.now())) return;
            return null;
        }, undefined, false);

        if (!result.committed) continue;
        await database.ref(`classroomRoomChats/${roomCode}`).remove();
        deletedCount += 1;
    }

    if (deletedCount) logger.info("Deleted inactive multiplayer rooms", { deletedCount });
});
