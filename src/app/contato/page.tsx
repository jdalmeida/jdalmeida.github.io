import {
	Building2,
	Clock,
	ExternalLink,
	Github,
	Linkedin,
	Mail,
	MapPin,
	MessageCircle,
} from "lucide-react";

export const metadata = {
	title: "Contato",
	description:
		"Entre em contato comigo para discutir projetos, oportunidades ou trocar ideias sobre tecnologia.",
};

export default function ContatoPage() {
	return (
		<div className="font-serif text-text-body py-12 px-6">
			<div className="max-w-[760px] mx-auto">
				{/* Header */}
				<div className="text-center mb-12">
					<h1 className="font-display font-semibold text-text-display-2 text-text-heading mb-4">
						Contato
					</h1>
					<p className="text-text-body-lg text-text-muted">
						Vamos conversar sobre tecnologia, projetos ou oportunidades
					</p>
				</div>

				<div className="grid md:grid-cols-2 gap-12">
					<div className="space-y-8">
						<div>
							<h2 className="font-serif font-bold text-text-h2 text-text-heading mb-6">
								Entre em contato
							</h2>
							<p className="text-text-body leading-relaxed mb-8">
								Estou sempre aberto para novas conversas, seja para discutir
								projetos, trocar ideias sobre tecnologia ou explorar
								oportunidades de colaboração.
							</p>
						</div>

						<div className="space-y-6">
							{/* Email */}
							<div className="flex items-start space-x-4">
								<div className="w-12 h-12 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center flex-shrink-0">
									<Mail className="text-accent-primary" size={20} />
								</div>
								<div>
									<h3 className="font-semibold text-text-heading mb-1">Email</h3>
									<a
										href="mailto:joao@allpines.com.br"
										className="text-accent-secondary hover:text-terracotta-700 transition-colors font-mono"
									>
										joao@allpines.com.br
									</a>
									<p className="text-text-muted text-text-small mt-1">
										A melhor forma de me contactar
									</p>
								</div>
							</div>

							{/* LinkedIn */}
							<div className="flex items-start space-x-4">
								<div className="w-12 h-12 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center flex-shrink-0">
									<Linkedin className="text-accent-primary" size={20} />
								</div>
								<div>
									<h3 className="font-semibold text-text-heading mb-1">LinkedIn</h3>
									<a
										href="https://linkedin.com/in/joao-de-almeida9"
										target="_blank"
										rel="noopener noreferrer"
										className="text-accent-secondary hover:text-terracotta-700 transition-colors font-mono inline-flex items-center"
									>
										/in/joao-de-almeida9
										<ExternalLink size={12} className="ml-1" />
									</a>
									<p className="text-text-muted text-text-small mt-1">
										Conecte-se comigo profissionalmente
									</p>
								</div>
							</div>

							{/* GitHub */}
							<div className="flex items-start space-x-4">
								<div className="w-12 h-12 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center flex-shrink-0">
									<Github className="text-accent-primary" size={20} />
								</div>
								<div>
									<h3 className="font-semibold text-text-heading mb-1">GitHub</h3>
									<a
										href="https://github.com/jdalmeida"
										target="_blank"
										rel="noopener noreferrer"
										className="text-accent-secondary hover:text-terracotta-700 transition-colors font-mono inline-flex items-center"
									>
										github.com/jdalmeida
										<ExternalLink size={12} className="ml-1" />
									</a>
									<p className="text-text-muted text-text-small mt-1">
										Veja meus projetos e contribuições
									</p>
								</div>
							</div>

							{/* Localização */}
							<div className="flex items-start space-x-4">
								<div className="w-12 h-12 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center flex-shrink-0">
									<MapPin className="text-accent-primary" size={20} />
								</div>
								<div>
									<h3 className="font-semibold text-text-heading mb-1">
										Localização
									</h3>
									<p className="text-text-body">Santa Cruz do Sul, RS</p>
									<p className="text-text-muted text-text-small mt-1 font-mono">Brasil (GMT-3)</p>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column */}
					<div className="space-y-8">
						{/* Allpines Info */}
						<div className="grain-overlay bg-surface-card border border-border-subtle rounded-[var(--radius-md)_var(--radius-sm)_var(--radius-md)_var(--radius-sm)] p-6 shadow-[var(--shadow-sm)]">
							<div className="flex items-center mb-4">
								<Building2 className="text-accent-primary mr-3" size={24} />
								<h3 className="text-xl font-bold text-text-heading">Allpines</h3>
							</div>
							<p className="text-text-body text-text-small mb-4 leading-relaxed">
								Como CTO da Allpines, lidero projetos de transformação digital e
								desenvolvimento de software.
							</p>
							<a
								href="https://allpines.com.br"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center text-accent-secondary hover:text-terracotta-700 font-medium transition-colors"
							>
								Conheça a Allpines
								<ExternalLink size={14} className="ml-2" />
							</a>
						</div>

						{/* Response Time */}
						<div className="grain-overlay bg-surface-card border border-border-subtle rounded-[var(--radius-md)_var(--radius-sm)_var(--radius-md)_var(--radius-sm)] p-6 shadow-[var(--shadow-sm)]">
							<div className="flex items-center mb-4">
								<Clock className="text-accent-primary mr-3" size={24} />
								<h3 className="text-xl font-bold text-text-heading">
									Tempo de Resposta
								</h3>
							</div>
							<p className="text-text-body text-text-small mb-4 leading-relaxed">
								Normalmente respondo e-mails dentro de 24-48 horas. Para assuntos
								urgentes, mencione no assunto.
							</p>
							<div className="text-text-small text-text-muted font-mono">
								<p>• Segunda a Sexta: Até 24h</p>
								<p>• Fins de Semana: Até 48h</p>
							</div>
						</div>

						{/* Topics */}
						<div className="grain-overlay bg-surface-card border border-border-subtle rounded-[var(--radius-md)_var(--radius-sm)_var(--radius-md)_var(--radius-sm)] p-6 shadow-[var(--shadow-sm)]">
							<div className="flex items-center mb-4">
								<MessageCircle className="text-accent-primary mr-3" size={24} />
								<h3 className="text-xl font-bold text-text-heading">
									Vamos conversar sobre
								</h3>
							</div>
							<div className="space-y-2">
								{[
									"Desenvolvimento de Software",
									"Liderança Técnica",
									"Transformação Digital",
									"Projetos de IA",
									"Arquitetura de Sistemas",
									"Mentoria em Tecnologia",
								].map((topic) => (
									<div
										key={topic}
										className="flex items-center text-text-small text-text-body"
									>
										<div className="w-1.5 h-1.5 bg-accent-primary rounded-full mr-3"></div>
										{topic}
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Call to Action */}
				<div className="mt-16 text-center grain-overlay bg-surface-card border border-border-subtle rounded-[var(--radius-md)_var(--radius-sm)_var(--radius-md)_var(--radius-sm)] shadow-[var(--shadow-sm)] p-8">
					<h2 className="font-serif font-bold text-text-h2 text-text-heading mb-4">
						Pronto para começar nossa conversa?
					</h2>
					<p className="text-text-body mb-6 leading-relaxed max-w-lg mx-auto">
						Seja qual for o assunto, estou ansioso para trocar ideias e conhecer
						mais sobre seus projetos.
					</p>
					<a
						href="mailto:joao@allpines.com.br?subject=Olá João! Gostaria de conversar sobre..."
						className="btn-primary"
					>
						Enviar E-mail
					</a>
				</div>
			</div>
		</div>
	);
}
