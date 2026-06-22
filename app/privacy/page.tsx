import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Política de privacidad | MaPlan",
  description: "Información sobre el tratamiento de datos en el prototipo personal y académico MaPlan."
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      description="Esta política resume qué información utiliza MaPlan, para qué se necesita y qué opciones tienen sus usuarios."
      title="Política de privacidad"
    >
      <section>
        <h2 className="text-xl font-bold text-zinc-950">1. Responsable y alcance</h2>
        <p className="mt-2">
          MaPlan es un proyecto personal y académico. Esta política se aplica al uso del prototipo y no pretende sustituir la
          documentación jurídica que sería necesaria antes de ofrecerlo como servicio comercial.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">2. Datos que puede utilizar MaPlan</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Correo electrónico y datos necesarios para autenticar la cuenta.</li>
          <li>Nombre, nombre de usuario y avatar elegidos para el perfil.</li>
          <li>Grupos, membresías, invitaciones, solicitudes y amistades.</li>
          <li>Lugares guardados, planes, paradas, votos, favoritos y estados de visita.</li>
          <li>Mensajes y referencias a lugares o planes compartidos en chats grupales.</li>
          <li>Datos técnicos imprescindibles para mantener sesiones y seguridad.</li>
          <li>Ubicación del dispositivo únicamente cuando el usuario concede permiso.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">3. Finalidad</h2>
        <p className="mt-2">
          Estos datos permiten crear y proteger cuentas, mostrar perfiles, gestionar relaciones y grupos, guardar lugares, organizar
          planes, sincronizar cambios, facilitar conversaciones y mejorar el funcionamiento del prototipo.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">4. Base general del tratamiento</h2>
        <p className="mt-2">
          El uso de los datos se vincula a las funciones que solicitas al crear una cuenta, participar en grupos o guardar contenido.
          Los permisos opcionales, como la ubicación, dependen de una acción o autorización del usuario. Antes de un lanzamiento
          comercial deberán concretarse formalmente las bases jurídicas aplicables.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">5. Ubicación</h2>
        <p className="mt-2">
          La ubicación se utiliza para centrar mapas, calcular distancias o mostrar recomendaciones cuando das permiso. No debe
          almacenarse permanentemente salvo que una función lo requiera y realices una acción explícita de guardado, por ejemplo al
          crear un lugar con coordenadas.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">6. Contenido compartido</h2>
        <p className="mt-2">
          Los mensajes, lugares, planes y demás contenido de grupo son visibles para los miembros autorizados conforme a la privacidad
          y permisos del grupo. Evita compartir información personal sensible que no sea necesaria para organizar la actividad.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">7. Proveedores externos</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Supabase proporciona autenticación, base de datos, políticas de acceso y sincronización Realtime.</li>
          <li>Mapbox representa mapas y puede recibir las solicitudes técnicas necesarias para cargar la cartografía.</li>
          <li>Google Places procesa búsquedas de lugares y proporciona metadatos, imágenes y referencias externas.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">8. Sincronización Realtime</h2>
        <p className="mt-2">
          Determinados cambios, como mensajes, notificaciones, lugares o planes, pueden actualizarse en tiempo real. Las políticas de
          acceso de Supabase limitan qué información puede recibir cada usuario.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">9. Almacenamiento y seguridad</h2>
        <p className="mt-2">
          MaPlan aplica autenticación, validación en servidor y políticas RLS para limitar el acceso a los datos. Ningún sistema puede
          garantizar seguridad absoluta, especialmente durante la fase de prototipo.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">10. Conservación y eliminación</h2>
        <p className="mt-2">
          Los datos se conservan mientras la cuenta o las funciones asociadas los necesiten. Al eliminar una cuenta, el perfil se
          anonimiza y la sesión se cierra; cierto contenido compartido puede conservarse de forma anonimizada para no romper el historial
          de los grupos.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">11. Opciones y derechos</h2>
        <p className="mt-2">
          Puedes actualizar tu perfil, gestionar contenidos y eliminar tu cuenta desde la aplicación. Para consultas sobre acceso,
          rectificación o eliminación de información, utiliza el contacto indicado al final de esta página.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">12. Cookies y almacenamiento local</h2>
        <p className="mt-2">
          La aplicación puede utilizar cookies o almacenamiento del navegador para mantener la sesión y recordar estados necesarios.
          No se describen actualmente usos publicitarios ni seguimiento comercial.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">13. Menores</h2>
        <p className="mt-2">
          MaPlan no está dirigido específicamente a menores ni pretende recoger deliberadamente sus datos. Si el proyecto se publica
          para uso general, deberán definirse requisitos de edad y consentimiento adecuados.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">14. Venta de datos y cambios</h2>
        <p className="mt-2">
          MaPlan no vende datos personales. Esta política puede cambiar cuando evolucionen las funciones o los proveedores; la fecha de
          actualización identifica la versión vigente.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">15. Contacto</h2>
        <p className="mt-2">
          Contacto pendiente de publicación: <strong>[correo de contacto de MaPlan]</strong>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
