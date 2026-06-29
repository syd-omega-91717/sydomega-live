// ============================================================================
// FILE: /backend/src/modules/identity/application/services/registration.application-service.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

import { Identity } from "../../domain/entities/identity.entity.js";
import { Email } from "../../domain/valueObjects/email.vo.js";
import { Password } from "../../domain/valueObjects/password.vo.js";

import type { IdentityRepository } from "../../domain/repositories/identity.repository.interface.js";

import passwordService from "../../../../security/cryptography/password.service.js";

import * as ApprovalService from "../../../../services/approval.service.js";
import * as NotificationService from "../../../../services/notification.service.js";
import * as EventService from "../../../../services/event.service.js";

export interface RegistrationRequest {

    email: string;

    username: string;

    password: string;

}

export class RegistrationApplicationService {

    constructor(

        private readonly repository: IdentityRepository

    ) {}

    public async register(

        request: RegistrationRequest

    ) {

        const email = new Email(

            request.email

        );

        const existing = await this.repository.findByEmail(

            email.toString()

        );

        if (existing) {

            throw new Error(

                "Email already exists."

            );

        }

        const passwordHash =

            await passwordService.hash(

                new Password(

                    request.password

                ).raw()

            );

        const identity = new Identity(

            crypto.randomUUID(),

            email.toString(),

            request.username,

            passwordHash,

            "user",

            "pending",

            "unverified",

            false,

            "pending",

            0,

            new Date(),

            new Date()

        );

        const created =

            await this.repository.create(

                identity

            );

        const approval =

            await ApprovalService.createApprovalRequest(

                created.id,

                {

                    request_type: "platform_access"

                }

            );

        await NotificationService.createNotification({

            recipient: created.id,

            sender: created.id,

            approval_request_id: approval.id,

            title: "Registration received",

            body: "Your account is awaiting founder approval.",

            notification_type: "registration"

        });

        await EventService.publish(

            created.id,

            created.id,

            "identity",

            "registered",

            {

                approvalId: approval.id

            }

        );

        return {

            identityId: created.id,

            approvalRequestId: approval.id,

            status: "pending"

        };

    }

}
