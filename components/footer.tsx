"use client"
import appConfig from "@/settings";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Mail, Phone, Printer, Circle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-12 text-white" style={{ backgroundColor: appConfig.pprimaryColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Séparateur */}
        <div className="border-t border-white/30 mb-8"></div>
        
        {/* Contenu principal */}
        <div className="grid md:grid-cols-4 gap-8">
          {/* Section Logo et slogan */}
          <div className="md:col-span-1">
            <div className="mb-6">
              <Image
                src="/armoirie-back.png"
                height={200}
                width={300}
                alt="Armoiries du Niger"
                className="object-contain mx-auto md:mx-0 brightness-0 invert"
              />
            </div>
            <p className="text-white/90 text-center md:text-center font-bold text-xl">
              Ministère de la Jeunesse, des Sports et de la Culture
            </p>
          </div>

          {/* Section Contacts */}
          <div className="md:col-span-1">
            <h2 className="text-lg font-bold text-white mb-4">Contacts</h2>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-white/90">
                <MapPin className="h-4 w-4 mr-3 text-white flex-shrink-0" />
                <span>Niamey Niger</span>
              </li>
              <li className="flex items-center text-sm text-white/90">
                <Mail className="h-4 w-4 mr-3 text-white flex-shrink-0" />
                <span>infos@mjs.gouv.ne</span>
              </li>
              <li className="flex items-center text-sm text-white/90">
                <Phone className="h-4 w-4 mr-3 text-white flex-shrink-0" />
                <span>+227 XX XX XX XX</span>
              </li>
              <li className="flex items-center text-sm text-white/90">
                <Printer className="h-4 w-4 mr-3 text-white flex-shrink-0" />
                <span>+227 XX XX XX XX</span>
              </li>
              <li className="flex items-center text-sm text-white/90">
                <Circle className="h-4 w-4 mr-3 text-white flex-shrink-0" />
                <span>BP : XX XX XX</span>
              </li>
            </ul>
            
            {/* Réseaux sociaux */}
            <div className="mt-6">
              <div className="flex space-x-4">
                <a href="https://web.facebook.com/profile.php?id=61551176005315" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                {/* Pour linkedin */}
                <a href="https://www.linkedin.com/company/mjs-niger" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
                  <svg className="h-8 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.335 18.339H15.67v-4.177c0-.996-.02-2.278-1.39-2.278-1.389 0-1.601 1.084-1.601 2.205v4.25h-2.666V9.75h2.56v1.17h.035c.358-.674 1.228-1.387 2.528-1.387 2.7 0 3.2 1.778 3.2 4.091v4.715zM7.995 8.25a1.036 1.036 0 0 1-1.036-1.035A1.036 1.036 0 0 1 7.995 6.182a1.036 1.036 0 0 1 1.036 1.036 1.036 1.036 0 0 1-1.036 1.036zM8.955 18.339H6.29v-9.214h2.665v9.214zM18.74 0H1.447C.651 0 0 .648 0 1.442v15.156c0 .794.651 1.442 1.447 1.442h17.293C19.349 18.339 20 17.691 20 16.897V1.442C20 .648 19.349 0 18.553 0z"/>
                  </svg>
                </a>
                <a href="https://x.com/HydrauliqueN" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://www.youtube.com/@HydrauliqueNiger" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Section Publications */}
          <div className="md:col-span-1">
            <h2 className="text-lg font-bold text-white mb-4">Publications</h2>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-white/90">
                <Circle className="h-3 w-3 mr-3 text-white flex-shrink-0" />
                <Link href="/publicites" className="hover:text-white transition-colors">
                  Publicités
                </Link>
              </li>
              <li className="flex items-center text-sm text-white/90">
                <Circle className="h-3 w-3 mr-3 text-white flex-shrink-0" />
                <Link href="/documentations" className="hover:text-white transition-colors">
                  Documentations
                </Link>
              </li>
              <li className="flex items-center text-sm text-white/90">
                <Circle className="h-3 w-3 mr-3 text-white flex-shrink-0" />
                <Link href="/videotheques" className="hover:text-white transition-colors">
                  Vidéos
                </Link>
              </li>
            </ul>
          </div>

          {/* Section Le Ministère */}
          <div className="md:col-span-1">
            <h2 className="text-lg font-bold text-white mb-4">Le Ministère</h2>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-white/90">
                <Circle className="h-3 w-3 mr-3 text-white flex-shrink-0" />
                <Link href="/projets-et-programmes" className="hover:text-white transition-colors">
                  Nos projets
                </Link>
              </li>
              <li className="flex items-center text-sm text-white/90">
                <Circle className="h-3 w-3 mr-3 text-white flex-shrink-0" />
                <Link href="/nos-services" className="hover:text-white transition-colors">
                  Nos Services
                </Link>
              </li>
              <li className="flex items-center text-sm text-white/90">
                <Circle className="h-3 w-3 mr-3 text-white flex-shrink-0" />
                <Link href="/portail" className="hover:text-white transition-colors">
                  Portail
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
