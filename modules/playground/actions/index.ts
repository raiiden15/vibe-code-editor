"use server"

import { db } from "@/lib/db"
import { TemplateFolder } from "../lib/path-to-json";
import { currentUser } from "@/modules/auth/actions";

export const getPlaygroundById = async(id: string) => {
    try {
        const playground = db.playground.findUnique({
            where: {id}, 
            select: {
            title: true,
            templateFile: {
                select: {
                    content: true
                }
            }
        }})

        return playground;
    } catch (error) {
        console.log(error);
        
    }
}

export const saveUpdatedCode = async(playgroundId: string, data: TemplateFolder) => {
    const user = await currentUser();
    if (!user) {
        return null;
    }

    try {
        const updatedPlayground = await db.templateFile.upsert({
            where: {
                playgroundId
            }, 
            update: {
                content: JSON.stringify(data)
            }, 
            create: {
                playgroundId,
                content: JSON.stringify(data)
            }
        })

        return updatedPlayground
    } catch (error) {
        console.log(error);
        
    }
}