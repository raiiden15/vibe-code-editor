import { readTemplateStructureFromJson, saveTemplateStructureToJson } from "@/modules/playground/lib/path-to-json";
import { db } from "@/lib/db";
import {templatePaths} from "@/lib/template"
import path from "path";
import fs from "fs/promises";
import { NextRequest } from "next/server";
import { success } from "zod";

function validateJsonStructure(data:unknown) {
    try {
        JSON.parse(JSON.stringify(data))
        return true
    } catch (error) {
        console.error("Invalid JSON Structure", error);
        return false
    }
}

export async function GET(request: NextRequest, {params} : {params: Promise<{id:string}>}) {
    const {id} = await params;
    if (!id) {
        return Response.json({
            error: "Missing Playground ID"
        }, {
            status: 404
        })
    }

    const playground = await db.playground.findUnique({
            where: {id}
    })
    if (!playground) {
        return Response.json(
            {error:"Playground Not Found"}, 
            {
                status: 402
            }
        )
    }

    const templateKey = playground.template as keyof typeof templatePaths;
    const templatePath = templatePaths[templateKey]
    
    if (!templatePath) {
        return Response.json(
            {error: "Invalid Template"}, 
            {status: 404}
        )
    }

    try {
        const inputPath = path.join(process.cwd(), templatePath)
        const outputFile = path.join(process.cwd(), `output/${templateKey}.json`)

        await saveTemplateStructureToJson(inputPath, outputFile)
        const result = await readTemplateStructureFromJson(outputFile)

        if (!validateJsonStructure(result.items)) {
            return Response.json(
                {error: "Invalid JSON Structure"}, 
                {status: 500}
            )
        }

        await fs.unlink(outputFile)

        return Response.json(
        {
            success: true,
            templateJson: result
        }, 
        {
            status: 200
        })
    } catch (error) {
        console.error("Error generating template JSON", error);
        return Response.json(
            {error: "Failed to generate template"},
            {status: 500}
        )
        
    }
}