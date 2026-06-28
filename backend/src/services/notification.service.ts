// ============================================================================
// FILE: /backend/src/services/notification.service.ts
// REPLACE THE ENTIRE FILE
// ============================================================================

import NotificationRepository from "../repositories/notification.repository.js";
import * as Events from "./event.service.js";
import logger from "../config/logger.js";

export async function createNotification(payload) {

    try {

        const notification = await NotificationRepository.create({

            title: payload.title,

            body: payload.body,

            recipient: payload.recipient,

            sender: payload.sender,

            approval_request_id: payload.approval_request_id,

            notification_type:

                payload.notification_type || "system",

            status: "unread",

            action_url:

                payload.action_url || null

        });

        await Events.publish(

            payload.sender,

            payload.recipient,

            "notification",

            "created",

            notification

        );

        logger.audit("Notification Created", {

            notificationId: notification.id,

            sender: payload.sender,

            recipient: payload.recipient

        });

        return notification;

    }

    catch (error) {

        logger.error("Notification Creation Failed", {

            error: error.message

        });

        throw error;

    }

}

export async function unread(profileId) {

    try {

        return await NotificationRepository.unread(profileId);

    }

    catch (error) {

        logger.error("Unread Notification Query Failed", {

            profileId,

            error: error.message

        });

        throw error;

    }

}

export async function all(profileId) {

    try {

        return await NotificationRepository.findMany(

            "recipient",

            profileId

        );

    }

    catch (error) {

        logger.error("Notification List Failed", {

            profileId,

            error: error.message

        });

        throw error;

    }

}

export async function read(notificationId) {

    try {

        return await NotificationRepository.update(

            notificationId,

            {

                status: "read",

                read_at: new Date()

            }

        );

    }

    catch (error) {

        logger.error("Read Notification Failed", {

            notificationId,

            error: error.message

        });

        throw error;

    }

}

export async function markAllRead(profileId) {

    try {

        const notifications =

            await NotificationRepository.unread(profileId);

        for (const item of notifications) {

            await NotificationRepository.update(

                item.id,

                {

                    status: "read",

                    read_at: new Date()

                }

            );

        }

        logger.audit("Notifications Marked Read", {

            profileId,

            count: notifications.length

        });

        return true;

    }

    catch (error) {

        logger.error("Mark All Read Failed", {

            profileId,

            error: error.message

        });

        throw error;

    }

}

export async function remove(notificationId) {

    try {

        await NotificationRepository.remove(notificationId);

        logger.audit("Notification Deleted", {

            notificationId

        });

        return true;

    }

    catch (error) {

        logger.error("Notification Delete Failed", {

            notificationId,

            error: error.message

        });

        throw error;

    }

}

export async function count(profileId) {

    try {

        const notifications =

            await NotificationRepository.unread(profileId);

        return notifications.length;

    }

    catch (error) {

        logger.error("Notification Count Failed", {

            profileId,

            error: error.message

        });

        throw error;

    }

}
