import Link from "next/link";
import { auth } from "@/auth";
import { getOrCreateUserByEmail } from "@/lib/db/users";
import { redirect } from "next/navigation";
import { saveProfileAction } from "./actions";
import Tooltip from "@/components/admin/Tooltip";
import AvatarUploader from "@/components/admin/AvatarUploader";

export const metadata = {
  title: "Perfil | Painel Admin",
  robots: { index: false, follow: false },
};

interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  instagram?: string;
  website?: string;
}

function parseLinks(raw: string | null): SocialLinks {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as SocialLinks;
  } catch {
    return {};
  }
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  const user = getOrCreateUserByEmail(session.user.email, session.user.name ?? "Admin");
  const links = parseLinks(user.social_links);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/admin"
        className="text-xs text-gray-400 hover:text-white inline-flex items-center mb-2"
      >
        ← Voltar ao Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">Perfil do autor</h1>
      <p className="text-gray-400 mb-8">
        Suas informações aparecem em todos os posts que você assina (Person
        schema, E-E-A-T do Google). Quanto mais completo, melhor o sinal de
        autoridade ao Google e às IAs.
      </p>

      <form action={saveProfileAction} className="space-y-6">
        <section className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Identidade</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome de exibição
              <Tooltip text="Como seu nome aparece nos posts. Use nome completo para máximo sinal de autoridade. Ex: 'Cleverson Gouvêa' não 'CG' ou 'Admin'." />
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={user.name}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              E-mail
              <Tooltip text="Imutável aqui — definido em ADMIN_EMAIL no .env. Vira opcionalmente o campo 'email' no schema.org/Person." />
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio / Sobre
              <Tooltip text="Biografia curta (2-4 frases). Inclua credenciais (anos de experiência, certificações, papel). Aparece no rodapé dos posts e vira 'description' no schema.org/Person. Google usa pra E-E-A-T." />
            </label>
            <textarea
              name="bio"
              rows={4}
              defaultValue={user.bio ?? ""}
              placeholder="Ex.: Desenvolvedor Full Stack com 15+ anos de experiência. Certificação Internacional Moodle. CTO da Agathas Web desde 2008, atendendo empresas no Brasil e exterior."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Avatar
              <Tooltip text="Foto sua quadrada. Será reduzida para 400×400 WebP automaticamente. Aparece no rodapé do post e no schema.org/Person.image." />
            </label>
            <AvatarUploader
              name="avatar_url"
              initialUrl={user.avatar_url}
              slugHint={user.name || user.email}
            />
          </div>
        </section>

        <section className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Perfis sociais (E-E-A-T)
            <Tooltip text="URLs completas para seus perfis profissionais. Viram sameAs no schema.org/Person — Google usa pra confirmar identidade e dar autoridade. LinkedIn é o mais importante. Deixe vazios os que não usar." />
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">LinkedIn</label>
              <input
                name="linkedin"
                type="url"
                defaultValue={links.linkedin ?? ""}
                placeholder="https://linkedin.com/in/seuperfil"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Twitter / X</label>
              <input
                name="twitter"
                type="url"
                defaultValue={links.twitter ?? ""}
                placeholder="https://twitter.com/seuhandle"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">GitHub</label>
              <input
                name="github"
                type="url"
                defaultValue={links.github ?? ""}
                placeholder="https://github.com/usuario"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Instagram</label>
              <input
                name="instagram"
                type="url"
                defaultValue={links.instagram ?? ""}
                placeholder="https://instagram.com/usuario"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-1">Site pessoal</label>
              <input
                name="website"
                type="url"
                defaultValue={links.website ?? ""}
                placeholder="https://seusite.com"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-voyia-blue hover:bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Salvar perfil
          </button>
        </div>
      </form>
    </div>
  );
}
