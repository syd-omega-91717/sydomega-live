// ============================================================================
// FILE: /backend/src/modules/identity/application/services/identity.service.ts
// NEW FILE
// ============================================================================

import type {

    IdentityRepository

} from "../../domain/repositories/identity.repository.interface.js";

import { Identity } from "../../domain/entities/identity.entity.js";

import passwordService from "../../../../security/cryptography/password.service.js";

import jwtService from "../../../../security/authentication/jwt.service.js";

import refreshTokenService from "../../../../security/authentication/refreshToken.service.js";

import {

    Email

} from "../../domain/valueObjects/email.vo.js";

import {

    Password

} from "../../domain/valueObjects/password.vo.js";

export class IdentityService {

    constructor(

        private readonly repository: IdentityRepository

    ) {}

    public async register(

        dto: {

            email: string;

            username: string;

            password: string;

        }

    ) {

        const email =

            new Email(dto.email);

        const password =

            new Password(dto.password);

        const existing =

            await this.repository.findByEmail(

                email.toString()

            );

        if (

            existing.isSuccess

        ) {

            throw new Error(

                "Email already exists."

            );

        }

        const hash =

            await passwordService.hash(

                password.raw()

            );

        const identity =

            new Identity(

                crypto.randomUUID(),

                email.toString(),

                dto.username,

                hash,

                "user",

                "pending",

                "unverified",

                false,

                "pending",

                0,

                new Date(),

                new Date()

            );

        return this.repository.create(

            identity

        );

    }

    public async login(

        email: string,

        password: string

    ) {

        const user =

            await this.repository.findByEmail(

                email

            );

        if (

            user.isFailure

        ) {

            throw new Error(

                "Invalid credentials."

            );

        }

        const valid =

            await passwordService.verify(

                password,

                user.value.passwordHash

            );

        if (!valid) {

            throw new Error(

                "Invalid credentials."

            );

        }

        const accessToken =

            jwtService.sign({

                sub: user.value.id,

                email: user.value.email,

                role: user.value.role

            });

        const refresh =

            refreshTokenService.generate();

        return {

            accessToken,

            refreshToken:

                refresh.token,

            expiresAt:

                refresh.expiresAt

        };

    }

}
