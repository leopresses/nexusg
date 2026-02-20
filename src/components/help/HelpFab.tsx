/**
 * HelpFab.tsx
 * Floating Action Button (FAB) for help — bottom-right corner.
 * Clicking it manually opens the help tour modal.
 */
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpFabProps {
  onOpen: () => void;
}

export function HelpFab({ onOpen }: HelpFabProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onOpen}
            aria-label="Abrir ajuda"
            className="
              fixed bottom-6 right-6 z-40
              h-12 w-12
              flex items-center justify-center
              rounded-full
              bg-blue-600 text-white
              shadow-lg shadow-blue-200
              hover:bg-blue-700 hover:scale-105
              active:scale-95
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2
            "
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="font-medium">
          Ajuda
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
