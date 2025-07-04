import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LanguageSelectorProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
  showText?: boolean;
}

export default function LanguageSelector({ 
  variant = "ghost", 
  size = "default",
  showText = false 
}: LanguageSelectorProps) {
  const { t, currentLang, setLanguage, languages } = useTranslation();
  
  console.log('LanguageSelector: Current language:', currentLang?.code);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Globe size={16} />
          {showText && (
            <span className="hidden sm:block">
              {t('nav.language')}
            </span>
          )}
          <span className="text-base">{currentLang?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        <AnimatePresence>
          {languages.map((lang) => (
            <motion.div
              key={lang.code}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <DropdownMenuItem
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center gap-3 cursor-pointer ${
                  currentLang?.code === lang.code 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-accent'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
                {currentLang?.code === lang.code && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 bg-primary rounded-full"
                  />
                )}
              </DropdownMenuItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}