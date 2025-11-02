"use client";
import { WebContainer } from "@webcontainer/api";
import { TemplateFolder } from "@/modules/playground/lib/path-to-json";
import { transformToWebContainerFormat } from "../hooks/transformer";
import React, { useEffect, useRef, useState } from "react";
import { flightRouterStateSchema } from "next/dist/server/app-render/types";
import { CheckCircle, Loader2, Terminal } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import TerminalComponent from "./terminal";

interface WebContainerPreviewProps {
    templateData: TemplateFolder;
    serverUrl: string;
    isLoading: boolean;
    error: string | null;
    instance: WebContainer | null;
    writeFileSync: (path: string, content: string) => Promise<void>;
    forceResetup?: boolean; // Optional prop to force re-setup
}

const WebContainerPreview = ({
    templateData,
    error,
    instance,
    isLoading,
    serverUrl,
    writeFileSync,
    forceResetup = false,
}: WebContainerPreviewProps) => {
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [loadingState, setLoadingState] = useState({
        transforming: false,
        mounting: false,
        installing: false,
        starting: false,
        ready: false,
    });
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = 4;
    const [setupError, setSetupError] = useState<string | null>(null);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [isSetupInProgress, setIsSetupInProgress] = useState(false);

    const terminalRef = useRef<any>(null);

    useEffect(() => {
        if (forceResetup) {
            setIsSetupComplete(false);
            setIsSetupInProgress(false)
            setPreviewUrl("")
            setCurrentStep(0)
            setLoadingState({
                transforming: false,
                mounting: false,
                installing: false,
                starting: false,
                ready: false
            });
        }
    })

    useEffect(() => {
        async function setupContainer() {
            if (!instance || isSetupComplete || isSetupInProgress) return;

            try {
                setIsSetupInProgress(true);
                setSetupError(null);

                try {
                    const packageJson = await instance?.fs.readFile(
                        "package.json",
                        "utf-8"
                    );

                    if (packageJson) {
                        if (terminalRef.current?.writeToTerminal) {
                            terminalRef.current.writeToTerminal("Reconnecting to existing web container session .... \r\n")
                        }
                        instance?.on(
                            "server-ready",
                            (port: number, url: string) => {
                                if (terminalRef.current?.writeToTerminal) {
                                    terminalRef.current.writeToTerminal(`Reconnected to server at ${url}. \r\n`)
                                }
                                setPreviewUrl(url);
                                setLoadingState((prev) => ({
                                    ...prev,
                                    starting: false,
                                    ready: true,
                                }));
                            }
                        );
                        setCurrentStep(4);
                        setLoadingState((prev) => ({
                            ...prev,
                            starting: true,
                        }));
                        return;
                    }
                } catch (error) {}

                // step 1 transform data
                setLoadingState((prev) => ({ ...prev, transforming: true }));
                setCurrentStep(1);

                if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal("Transforming Template Data ... \r\n")
                }
                // @ts-ignore
                const files = transformToWebContainerFormat(templateData);

                // step 2
                setLoadingState((prev) => ({
                    ...prev,
                    transforming: false,
                    mounting: true,
                }));

                setCurrentStep(2);
                // add terminal logic
                if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal("Mounting Files to web container ... \r\n")
                }
                await instance.mount(files);

                // todo terminal logic
                if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal("Files mounted Successfully ... \r\n")
                }

                // step 3
                setLoadingState((prev) => ({
                    ...prev,
                    mounting: false,
                    insalling: true,
                }));
                setCurrentStep(3);

                if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal("Installing Dependencies ... \r\n")
                }

                // todo terminal logic

                const installProcess = await instance.spawn("npm", ["install"]);
                installProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            if (terminalRef.current?.writeToTerminal) {
                                terminalRef.current.writeToTerminal(data)
                            }   
                        },
                    })
                );

                const installExitCOde = await installProcess.exit;
                if (installExitCOde != 0) {
                    throw new Error("Failed to install dependencies");
                }

                // terminal logic
                if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal("Dependencies Installed Successfully... \r\n")
                }
                // step 4
                setLoadingState((prev) => ({
                    ...prev,
                    insalling: false,
                    starting: true,
                }));
                setCurrentStep(4);

                // todo terminal logic
                if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal("Starting development Server ... \r\n")
                }

                const startProcess = await instance.spawn("npm", [
                    "run",
                    "start",
                ]);
                instance.on("server-ready", (port: number, url: string) => {
                    // todo - terminal logic
                    if (terminalRef.current?.writeToTerminal) {
                        terminalRef.current.writeToTerminal(`Server ready at ${url} ... \r\n`)
                    }
                    setPreviewUrl(url);
                    setLoadingState((prev) => ({
                        ...prev,
                        starting: false,
                        ready: true,
                    }));
                    setIsSetupComplete(true);
                    setIsSetupInProgress(false);
                });

                // handle start process output
                startProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            if (terminalRef.current?.writeToTerminal) {
                                terminalRef.current.writeToTerminal(data)
                            }
                        },
                    })
                );
            } catch (error) {
                console.log(error);
                const errmsg = error instanceof Error ? error.message : String(error)
                if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal(`Error : ${errmsg} \r\n`)
                }
                setSetupError(errmsg)
                setIsSetupComplete(false)
                setLoadingState({       
                    transforming: false,
                    mounting: false,
                    installing: false,
                    starting: false,
                    ready: false
                })
            }
        }

        setupContainer();
    }, [instance, templateData, isSetupComplete, isSetupComplete]);

    useEffect(() => {
        return () => {

        }
    }, [])

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md p-6 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <h3 className="text-lg font-medium">Initializing Web Container</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Setting up environment for project</p>
                </div>
            </div>
        )
    }

    if (error || setupError) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="bg-red-50 dard:bg-red-900/20 text-red-600 dard:text-red-400 p-6 rounded-lg max-w-md">
                    <Loader2 className="flex items-center gap-2 mb-2" />
                    <h3 className="font-semibold">Error</h3>
                    <p className="text-sm">{error || setupError}</p>
                </div>
            </div>
        )
    }

    const getStepIcon = (stepIndex: number) => {
        if (stepIndex < currentStep) {
            return <CheckCircle className="h-5 w-5 text-green-500" />
        } else if (stepIndex === currentStep) {
            return <Loader2 className="h-5 w-5 animate-spin text-blue-500"/>
        } else {
            return <div className="h-5 w-5 rounded-full border-2 border-gray-300"/>
        }
    }

    const getStepText = (stepIndex: number, label: string) => {

        const isActive = stepIndex === currentStep
        const isComplete = stepIndex < currentStep
        return (
            <span className = {`text-sm font-medium ${isComplete ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-500'}`}>{label}</span>
        )
    }
    
    return <div className="h-full w-full flex flex-col">
        {
            !previewUrl ? (
                <div className="h-full flex flex-col">
                <div className="w-full max-w-md p-6 m-5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm mx-auto">
                    <Progress
                    value={(currentStep / totalSteps) * 100}
                    className="h-2 mb-6"
                    />

                    <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                        {getStepIcon(1)}
                        {getStepText(1, "Transforming template data")}
                    </div>
                    <div className="flex items-center gap-3">
                        {getStepIcon(2)}
                        {getStepText(2, "Mounting files")}
                    </div>
                    <div className="flex items-center gap-3">
                        {getStepIcon(3)}
                        {getStepText(3, "Installing dependencies")}
                    </div>
                    <div className="flex items-center gap-3">
                        {getStepIcon(4)}
                        {getStepText(4, "Starting development server")}
                    </div>
                    </div>
                </div>

                {/* Terminal */}
                <div className="flex-1 p-4">
                    <TerminalComponent
                    ref={terminalRef}
                    webContainerInstance={instance}
                    theme="dark"
                    className="h-full"
                    />
                </div>
                </div>
            ) : (
                <div className="h-full flex flex-col ">
                    <div className="flex-1">
                        <iframe src = {previewUrl}
                            className = "w-full h-full border-none"
                            title = "Web Container preview"
                            />
                    </div>

                    <div className="h-64 border-t">
                         <TerminalComponent
                        ref={terminalRef}
                        webContainerInstance={instance}
                        theme="dark"
                        className="h-full"
                        />
                    </div>

                </div>
            )
        } 
    </div>;
};

export default WebContainerPreview;
