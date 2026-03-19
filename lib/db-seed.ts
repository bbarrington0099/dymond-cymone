import { Prisma } from "@prismagen/client";
import * as db from "./db";

export async function createArtistProfile(data: Prisma.ArtistProfileCreateInput & { plainPassword: string }): Promise<Prisma.ArtistProfileGetPayload<{}>> {
    return await db.createArtistProfile(data);
}