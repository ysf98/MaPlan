import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Términos y condiciones | MaPlan",
  description: "Condiciones de uso del prototipo personal y académico MaPlan."
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      description="Estas condiciones explican las reglas básicas para utilizar MaPlan y sus funciones colaborativas."
      title="Términos y condiciones"
    >
      <section>
        <h2 className="text-xl font-bold text-zinc-950">1. Naturaleza del proyecto</h2>
        <p className="mt-2">
          MaPlan es un proyecto personal y un prototipo académico de planificación social. Permite organizar lugares, mapas, grupos,
          planes y conversaciones, pero no se presenta actualmente como un servicio comercial ni garantiza disponibilidad permanente.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">2. Uso de la aplicación</h2>
        <p className="mt-2">
          Debes utilizar MaPlan de forma responsable, respetando a otros usuarios y la legislación aplicable. Las funciones pueden
          cambiar, interrumpirse o retirarse durante el desarrollo del prototipo.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">3. Cuenta y acceso</h2>
        <p className="mt-2">
          Eres responsable de mantener la confidencialidad de tus credenciales y de la actividad realizada desde tu cuenta. No debes
          acceder a cuentas ajenas ni compartir credenciales de terceros sin autorización.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">4. Contenido y colaboración</h2>
        <p className="mt-2">
          Los lugares, planes, mensajes, imágenes, notas y demás contenido que añadas continúan siendo responsabilidad de quien los
          aporta. Al compartir contenido dentro de un grupo, aceptas que sus miembros autorizados puedan verlo y utilizarlo para las
          funciones colaborativas de MaPlan.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">5. Grupos, planes y chat</h2>
        <p className="mt-2">
          Los permisos dependen de la privacidad del grupo y del rol de cada usuario. No debes utilizar grupos o chats para acosar,
          engañar, suplantar identidades, difundir contenido ilícito o vulnerar derechos de otras personas.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">6. Conductas prohibidas</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Interferir con la seguridad, disponibilidad o funcionamiento de la aplicación.</li>
          <li>Intentar eludir permisos, controles de acceso o políticas de seguridad.</li>
          <li>Publicar contenido ilícito, dañino, engañoso o que vulnere derechos de terceros.</li>
          <li>Utilizar datos obtenidos mediante MaPlan para enviar comunicaciones no solicitadas.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">7. Servicios externos</h2>
        <p className="mt-2">
          MaPlan utiliza Supabase para autenticación y almacenamiento, Mapbox para la representación de mapas y Google Places para
          búsquedas y metadatos de lugares. El funcionamiento de estas prestaciones también depende de las condiciones y disponibilidad
          de dichos proveedores.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">8. Disponibilidad y responsabilidad</h2>
        <p className="mt-2">
          El prototipo se ofrece tal como está y puede contener errores, datos incompletos o interrupciones. MaPlan no debe utilizarse
          como única fuente para decisiones críticas, rutas de emergencia, información médica, jurídica o financiera.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">9. Suspensión y eliminación</h2>
        <p className="mt-2">
          Una cuenta puede suspenderse o eliminarse si compromete la seguridad, incumple estas condiciones o perjudica a otros usuarios.
          El propio usuario puede solicitar la eliminación desde las opciones disponibles en su perfil.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">10. Cambios en estas condiciones</h2>
        <p className="mt-2">
          Estas condiciones pueden actualizarse cuando cambien las funciones o la naturaleza del proyecto. La fecha indicada al inicio
          permite identificar la versión vigente.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-950">11. Contacto</h2>
        <p className="mt-2">
          Contacto pendiente de publicación: <strong>[correo de contacto de MaPlan]</strong>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
