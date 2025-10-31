"use server"

import { currentUser } from "@/modules/auth/actions"
import { db } from "@/lib/db"
// fetch all data created by the user (playground data)
export const getAllPlaygroundForUser = async() => {
    const user = await currentUser()
    try {
        const playground = await db.playground.findMany({
                where: {
                userId:user?.id
            }, include: {
                user: true
            }
        })

        return playground; 
    } catch (error) {
        console.log(error);
        
    }
}