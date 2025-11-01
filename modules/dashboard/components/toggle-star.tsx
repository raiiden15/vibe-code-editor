import React from 'react'

import { Button } from '@/components/ui/button'
import {StarIcon, StarOffIcon} from "lucide-react"
import { useState, useEffect, forwardRef } from 'react'
import { toast } from 'sonner'
import { toggleStarMark } from '../actions'

interface MarkedToggleButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
    markedForRevision: boolean,
    id: string
}

export const MarkedToggleButton = forwardRef<HTMLButtonElement, MarkedToggleButtonProps> (
    ({markedForRevision, id, onClick, className, children, ...props}, ref) => {
        const [isMarked, setIsMarked] = useState(markedForRevision)
        
        useEffect(() => {
            setIsMarked(markedForRevision)
        }, [markedForRevision])

        const handleToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
            onClick?.(event)
            const newMarkedState = !isMarked;
            setIsMarked(newMarkedState)

            try {
                const res = await toggleStarMark(id, newMarkedState)
                const {success, error, isMarked} = res;

                if (isMarked && !error && success) {
                    toast.success("Added to Favorites Successfully!")
                } else {
                    toast.success("Removed From Favorites Successfully")
                }
            } catch (error) {
                console.error("Failed to toggle mark for revision: ", error);
                setIsMarked(!newMarkedState)                
            }
        }

        return (
            <Button ref = {ref}
                    variant="ghost"
                    className={`flex items-center justify-start w-full px-2 py-1.5 text-sm rounded-md cursor-pointer ${className}`}
                    onClick={handleToggle}
                    {...props} >
                        {isMarked ? (
                            <StarIcon size = {16} className = "text-red-500 mr--2" />
                        ) : (
                            <StarOffIcon size = {16} className = "text-gray-500 mr-2" />
                        )}
                    {children || (isMarked ? "Remove Favorite" : "Add to Favorite")}
            </Button>
        )
    }
)