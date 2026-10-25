import React from 'react'
import { 
    Users, 
    Trophy, 
    Calendar, 
    FileText, 
    Phone, 
    Mail, 
    MapPin,
    ArrowRight,
    Star,
    Award,
    Target,
    Heart,
    ChevronRight,
    ChevronLeft
  } from "lucide-react";
  import { cn } from "@/lib/utils";
  import { Card, CardContent } from "@/components/ui/card";
  import ContactForm from "@/components/main/contact-form";

export default function Contact() {
  return (
    <div>
    <section id="contact" className="py-20 bg-gradient-to-br from-gray-50 via-white to-primaryLightTransparentColor">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primaryColor/10 border-2 border-primaryColor/30 rounded-full mb-6">
              <Mail className="h-8 w-8 text-primaryColor" />
            </div>
            <h2 className={cn("text-3xl md:text-4xl font-bold mb-4 text-gray-900")}>
              Contactez-nous
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une question ? Un projet ? Nous sommes là pour vous accompagner
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <Card className="border-2 border-primaryLightTransparentColor shadow-md hover:shadow-lg hover:border-primaryColor transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primaryLightTransparentColor to-primaryTransparentColor rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Phone className="h-7 w-7 text-primaryColor" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">Téléphone</h3>
                      <p className="text-gray-600">+227 XX XX XX XX</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primaryLightTransparentColor shadow-md hover:shadow-lg hover:border-primaryColor transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primaryLightTransparentColor to-primaryTransparentColor rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Mail className="h-7 w-7 text-primaryColor" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">Email</h3>
                      <p className="text-gray-600">contact@mjs.gov.ne</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primaryLightTransparentColor shadow-md hover:shadow-lg hover:border-primaryColor transition-all duration-300 group">
                <CardContent className="p-6 pb-8">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-primaryLightTransparentColor to-primaryTransparentColor rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <MapPin className="h-7 w-7 text-primaryColor" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">Adresse</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Ministère de la Jeunesse, des Sports et de la Culture<br />
                        Niamey, Niger
                      </p>
                    </div>
                  </div>
                  {/* Carte de localisation */}
                  <div className="w-full h-64 rounded-lg overflow-hidden border-2 border-primaryLightTransparentColor">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3133.5!2d2.1097!3d13.5127!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDMwJzQ1LjciTiAywrAwNiczNC45IkU!5e0!3m2!1sfr!2sne!4v1234567890"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                    ></iframe>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-primaryLightTransparentColor shadow-lg bg-gradient-to-br from-white to-primaryLightTransparentColor">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-primaryLightTransparentColor rounded-lg flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-primaryColor" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Envoyez-nous un message</h3>
                  <p className="text-sm text-gray-600">Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.</p>
                </div>
                <ContactForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}