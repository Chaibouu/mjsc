"use client"
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import appConfig from "@/settings";
import Image from "next/image";
import { Users, Trophy,  Heart,} from "lucide-react";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
})



export default function Main() {

  return (
    <>
      {/* Section Présentation du Ministre */}
      <section className="py-12 lg:py-16 relative overflow-hidden" style={{ backgroundColor: appConfig.pprimaryColor }}>
        {/* Image de fond au centre - Armoiries back */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Image
            src="/armoirie-back.png"
            height={400}
            width={600}
            alt="Armoiries fond"
            className="object-contain"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between px-8">
            {/* Armoiries à gauche - masquées sur mobile */}
            <div className="hidden md:flex justify-center md:justify-start">
              <Image
                src={appConfig.logoUrl}
                height={300}
                width={400}
                alt="Armoiries du Niger"
                className="object-contain"
              />
            </div>

            {/* Photo et informations du ministre à droite */}
            <div className="space-y-4 md:text-right flex flex-col items-center ">
              {/* Photo du ministre */}
              <div className="relative w-full mx-auto md:ml-auto md:mr-0">
                <Image
                  src="/ministre.jpg"
                  height={250}
                  width={375}
                  alt="Photo du Ministre"
                  className="object-cover rounded-lg shadow-lg"
                />
              </div>

              {/* Nom du ministre */}
              <div className="text-center md:text-left flex flex-col justify-center items-center">
                <h2 className={cn(
                  "text-xl lg:text-2xl font-bold text-white mb-3",
                  font.className
                )}>
                  Sidi MOHAMED ALMAHMOUD
                </h2>

                {/* Arc décoratif */}
                <div className="flex justify-center md:justify-start mb-3">
                  <Image
                    src="/arc.png"
                    height={40}
                    width={300}
                    alt="Arc"
                    className="object-contain"
                  />
                </div>

                {/* Titre du ministre */}
                <h3 className={cn(
                  "text-base lg:text-lg font-semibold text-white/90",
                  font.className
                )}>
                  Ministre de la Jeunesse, des Sports et de la Culture
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 via-white to-primaryLightTransparentColor">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-lg border-2 border-primaryLightTransparentColor shadow-md hover:shadow-lg hover:border-primaryColor transition-all duration-300">
              <div className="text-4xl font-bold mb-2 text-primaryColor">50+</div>
              <div className="text-gray-600 font-medium">Fédérations sportives</div>
            </div>
            <div className="text-center p-6 bg-white rounded-lg border-2 border-primaryLightTransparentColor shadow-md hover:shadow-lg hover:border-primaryColor transition-all duration-300">
              <div className="text-4xl font-bold mb-2 text-primaryColor">200+</div>
              <div className="text-gray-600 font-medium">Associations de jeunesse</div>
            </div>
            <div className="text-center p-6 bg-white rounded-lg border-2 border-primaryLightTransparentColor shadow-md hover:shadow-lg hover:border-primaryColor transition-all duration-300">
              <div className="text-4xl font-bold mb-2 text-primaryColor">1000+</div>
              <div className="text-gray-600 font-medium">Événements annuels</div>
            </div>
            <div className="text-center p-6 bg-white rounded-lg border-2 border-primaryLightTransparentColor shadow-md hover:shadow-lg hover:border-primaryColor transition-all duration-300">
              <div className="text-4xl font-bold mb-2 text-primaryColor">50000+</div>
              <div className="text-gray-600 font-medium">Jeunes accompagnés</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="a-propos" className="py-20 bg-gradient-to-br from-white via-gray-50 to-primaryLightTransparentColor">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={cn(
              "text-3xl md:text-4xl font-bold text-gray-900 mb-4",
              font.className
            )}>
              Nos Domaines d'Action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Le Ministère de la Jeunesse, des Sports et de la Culture œuvre pour le développement de la jeunesse, du sport et de la culture au Niger 
              à travers des programmes innovants et des initiatives structurantes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 border-primaryLightTransparentColor hover:shadow-xl hover:border-primaryColor transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-secondaryLightTransparentColor to-secondaryTransparentColor rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="h-10 w-10 text-secondaryColor" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl text-gray-900 mb-2">Jeunesse</CardTitle>
                    <CardDescription className="text-gray-600">
                      Programmes d'insertion, formations, concours et accompagnement des jeunes
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              {/* <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primaryColor rounded-full mr-2"></span>
                    Formation professionnelle
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primaryColor rounded-full mr-2"></span>
                    Concours et bourses
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primaryColor rounded-full mr-2"></span>
                    Insertion socio-économique
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primaryColor rounded-full mr-2"></span>
                    Leadership et citoyenneté
                  </li>
                </ul>
              </CardContent> */}
            </Card>

            <Card className="border-2 border-primaryLightTransparentColor hover:shadow-xl hover:border-primaryColor transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-secondaryLightTransparentColor to-secondaryTransparentColor rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Trophy className="h-10 w-10 text-secondaryColor" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl text-gray-900 mb-2">Sports</CardTitle>
                    <CardDescription className="text-gray-600">
                      Développement du sport national, compétitions et infrastructures
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              {/* <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-secondaryColor rounded-full mr-2"></span>
                    Compétitions nationales
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-secondaryColor rounded-full mr-2"></span>
                    Formation des athlètes
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-secondaryColor rounded-full mr-2"></span>
                    Infrastructures sportives
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-secondaryColor rounded-full mr-2"></span>
                    Fédérations sportives
                  </li>
                </ul>
              </CardContent> */}
            </Card>

            <Card className="border-2 border-primaryLightTransparentColor hover:shadow-xl hover:border-primaryColor transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-secondaryLightTransparentColor to-secondaryTransparentColor rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Heart className="h-10 w-10 text-secondaryColor" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl text-gray-900 mb-2">Social</CardTitle>
                    <CardDescription className="text-gray-600">
                      Actions sociales, solidarité et développement communautaire
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              {/* <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primaryColor rounded-full mr-2"></span>
                    Actions sociales
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primaryColor rounded-full mr-2"></span>
                    Développement communautaire
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primaryColor rounded-full mr-2"></span>
                    Solidarité nationale
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primaryColor rounded-full mr-2"></span>
                    Éducation civique
                  </li>
                </ul>
              </CardContent> */}
            </Card>
          </div>
        </div>
      </section>

    </>
  )
}
