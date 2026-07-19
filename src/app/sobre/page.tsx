import { Building2, Calendar, MapPin, Target, Users, Zap } from "lucide-react";
import Link from "next/link";

export const metadata = {
	title: "Sobre",
	description:
		"Conheça mais sobre João de Almeida, CTO da Allpines e sua trajetória na tecnologia.",
};

export default function SobrePage() {
	return (
		<div className="font-serif text-text-body py-12 px-6">
			<div className="max-w-[760px] mx-auto">
				{/* Header */}
				<div className="text-center mb-12">
					<h1 className="font-display font-semibold text-text-display-2 text-text-heading mb-4">
						Sobre mim
					</h1>
					<p className="text-text-body-lg text-text-muted">
						Conheça minha trajetória e paixão pela tecnologia
					</p>
				</div>

				{/* Main content */}
				<div className="space-y-12">
					{/* Bio */}
					<section className="prose prose-lg max-w-none">
						<p className="text-text-body-lg leading-relaxed text-text-body">
							Sou <strong className="text-text-heading">João de Almeida</strong>,
							CTO da <span className="text-accent-primary font-semibold">Allpines</span>, uma
							empresa de soluções digitais que fundamos em 2023 com o propósito
							de transformar ideias em tecnologia. Como Chief Technology
							Officer, lidero nossa equipe técnica na criação de soluções
							inovadoras que impactam positivamente os negócios de nossos
							clientes.
						</p>

						<p className="text-text-body-lg leading-relaxed text-text-body mt-4">
							Minha paixão pela tecnologia vai além do código. Acredito no poder
							da tecnologia como ferramenta de transformação social e
							empresarial, e trabalho constantemente para entregar soluções que
							realmente fazem a diferença na vida das pessoas e no crescimento
							das empresas.
						</p>
					</section>

					{/* Company Info */}
					<section className="grain-overlay bg-surface-card border border-border-subtle rounded-[var(--radius-md)_var(--radius-sm)_var(--radius-md)_var(--radius-sm)] shadow-[var(--shadow-sm)] p-8">
						<h2 className="font-serif font-bold text-text-h2 text-text-heading mb-6 flex items-center">
							<Building2 className="mr-3 text-accent-primary" />
							Allpines
						</h2>

						<div className="grid md:grid-cols-2 gap-8">
							<div>
								<h3 className="font-semibold text-text-heading mb-3">
									Nossa missão
								</h3>
								<p className="text-text-body mb-4">
									Transformar ideias em soluções tecnológicas que impulsionam o
									crescimento e a inovação de empresas médias e pequenas.
								</p>

								<div className="flex items-center text-text-muted mb-2 font-mono text-text-small">
									<MapPin size={16} className="mr-2 text-accent-primary" />
									Santa Cruz do Sul, RS
								</div>

								<div className="flex items-center text-text-muted font-mono text-text-small">
									<Calendar size={16} className="mr-2 text-accent-primary" />
									Fundada em 2023
								</div>
							</div>

							<div>
								<h3 className="font-semibold text-text-heading mb-3">
									Nossa equipe
								</h3>
								<div className="space-y-2 font-mono text-text-small">
									<div className="flex items-center justify-between border-b border-border-subtle/50 pb-1">
										<span className="text-text-body">Ruan Bueno</span>
										<span className="text-accent-primary font-semibold">
											CEO
										</span>
									</div>
									<div className="flex items-center justify-between border-b border-border-subtle/50 pb-1">
										<span className="text-text-body">João de Almeida</span>
										<span className="text-accent-primary font-semibold">
											CTO
										</span>
									</div>
									<div className="flex items-center justify-between border-b border-border-subtle/50 pb-1">
										<span className="text-text-body">Douglas Fantoni</span>
										<span className="text-accent-primary font-semibold">
											GCO
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-text-body">Bruno Eliel</span>
										<span className="text-accent-primary font-semibold">
											CI/CD
										</span>
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* Services */}
					<section>
						<h2 className="font-display font-semibold text-text-display-2 text-text-heading mb-8 text-center">
							O que fazemos na Allpines
						</h2>

						<div className="grid md:grid-cols-3 gap-6">
							<div className="card p-6 text-center group">
								<div className="w-12 h-12 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
									<Zap className="text-accent-primary" size={24} />
								</div>
								<h3 className="font-serif font-bold text-text-h3 text-text-heading mb-2">
									Software
								</h3>
								<p className="text-text-muted text-text-small">
									Aplicações web e mobile personalizadas com tecnologias modernas
								</p>
							</div>

							<div className="card p-6 text-center group">
								<div className="w-12 h-12 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
									<Target className="text-accent-primary" size={24} />
								</div>
								<h3 className="font-serif font-bold text-text-h3 text-text-heading mb-2">
									Automação
								</h3>
								<p className="text-text-muted text-text-small">
									Otimização de fluxos de trabalho para aumentar eficiência
								</p>
							</div>

							<div className="card p-6 text-center group">
								<div className="w-12 h-12 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
									<Users className="text-accent-primary" size={24} />
								</div>
								<h3 className="font-serif font-bold text-text-h3 text-text-heading mb-2">
									BI
								</h3>
								<p className="text-text-muted text-text-small">
									Transformamos dados em insights para decisões estratégicas
								</p>
							</div>
						</div>
					</section>

					{/* CTA */}
					<section className="grain-overlay bg-surface-card border border-border-subtle rounded-[var(--radius-md)_var(--radius-sm)_var(--radius-md)_var(--radius-sm)] shadow-[var(--shadow-sm)] p-8 text-center">
						<h2 className="font-serif font-bold text-text-h2 text-text-heading mb-4">
							Vamos conversar sobre tecnologia?
						</h2>
						<p className="text-text-body mb-6 max-w-2xl mx-auto leading-relaxed">
							Seja para trocar ideias, discutir projetos ou conhecer mais sobre
							a Allpines, estou sempre aberto para novas conversas e
							oportunidades.
						</p>

						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="/#contato" className="btn-primary">
								Entrar em contato
							</Link>
							<a
								href="https://allpines.com.br"
								target="_blank"
								rel="noopener noreferrer"
								className="btn-secondary"
							>
								Conhecer a Allpines
							</a>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
