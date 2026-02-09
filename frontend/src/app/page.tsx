"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AnimateIn,
  StaggerGroup,
  fadeIn,
  fadeInUp,
  scaleIn,
  slideInLeft,
  slideInRight,
} from "@/components/motion";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-amber-900 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <AnimateIn className="max-w-3xl" variants={fadeInUp}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-4xl">🌿</span>
              <span className="text-sm font-medium bg-white/10 rounded-full px-3 py-1">
                Blockchain &bull; Farm-to-Table
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Del campo ecuatoriano
              <br />
              <span className="text-amber-300">a tu taza.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl">
              Trazabilidad inmutable en blockchain para cacao y café premium de
              Ecuador. Cada lote verificable desde la cosecha hasta la entrega
              final.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                <Link href="/verify">📱 Escanear QR</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Link href="/track">🔍 Rastrear Lote</Link>
              </Button>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b bg-card">
        <StaggerGroup className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((stat) => (
              <AnimateIn key={stat.label} variants={scaleIn}>
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </AnimateIn>
            ))}
          </div>
        </StaggerGroup>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <AnimateIn className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">¿Cómo Funciona?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cada lote de cacao o café recibe un token único en la blockchain de
            Polygon. Su viaje queda registrado de forma inmutable.
          </p>
        </AnimateIn>

        <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <AnimateIn key={step.title} variants={fadeInUp}>
              <Card className="text-center h-full">
              <CardHeader>
                <div className="text-4xl mb-2">{step.icon}</div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
            </AnimateIn>
          ))}
        </StaggerGroup>
      </section>

      {/* Timeline States — Redesigned Pipeline */}
      <section className="bg-muted/50 py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <AnimateIn className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              6 Estados de Trazabilidad
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada lote pasa por 6 estados verificados on-chain, desde la
              cosecha en las fincas de Ecuador hasta la entrega al comprador
              final.
            </p>
          </AnimateIn>

          {/* Desktop: Horizontal pipeline */}
          <div className="hidden md:block">
            <StaggerGroup className="relative">
              {/* Connecting line */}
              <div className="absolute top-10 left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-green-600 via-amber-500 to-emerald-500 rounded-full" />

              <div className="grid grid-cols-6 gap-4 relative">
                {STATES.map((state, index) => (
                  <AnimateIn key={state.label} variants={fadeInUp} delay={index * 0.1}>
                    <div className="flex flex-col items-center text-center">
                      {/* Node circle */}
                      <div
                        className={`relative z-10 w-20 h-20 rounded-full ${state.color} flex items-center justify-center text-3xl shadow-lg ring-4 ring-background transition-transform hover:scale-110`}
                      >
                        {state.icon}
                      </div>
                      {/* Step number */}
                      <span className="mt-3 text-xs font-bold text-muted-foreground">
                        PASO {index + 1}
                      </span>
                      {/* Label */}
                      <span className="mt-1 text-sm font-semibold">
                        {state.label}
                      </span>
                      {/* Description */}
                      <span className="mt-1 text-xs text-muted-foreground leading-tight max-w-[120px]">
                        {state.desc}
                      </span>
                    </div>
                  </AnimateIn>
                ))}
              </div>
            </StaggerGroup>
          </div>

          {/* Mobile: Vertical timeline */}
          <div className="md:hidden">
            <div className="relative ml-6">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-600 via-amber-500 to-emerald-500" />

              <div className="space-y-8">
                {STATES.map((state, index) => (
                  <AnimateIn key={state.label} variants={slideInLeft} delay={index * 0.08}>
                    <div className="flex items-start gap-4">
                      {/* Node */}
                      <div
                        className={`relative z-10 w-10 h-10 rounded-full ${state.color} flex items-center justify-center text-lg shadow-md ring-2 ring-background flex-shrink-0`}
                      >
                        {state.icon}
                      </div>
                      {/* Content */}
                      <div className="pt-1">
                        <span className="text-xs font-bold text-muted-foreground">
                          PASO {index + 1}
                        </span>
                        <p className="text-sm font-semibold">{state.label}</p>
                        <p className="text-xs text-muted-foreground">{state.desc}</p>
                      </div>
                    </div>
                  </AnimateIn>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <AnimateIn variants={slideInLeft}>
            <h2 className="text-3xl font-bold mb-4">Nuestra Misión</h2>
            <p className="text-muted-foreground mb-4">
              Pacha-Chain-Origin nace para proteger al agricultor ecuatoriano y
              empoderar al consumidor consciente. Creemos que cada grano de cacao
              y cada cereza de café tienen una historia que merece ser contada y
              verificada.
            </p>
            <p className="text-muted-foreground mb-6">
              Usando tecnología blockchain, eliminamos intermediarios opacos y
              garantizamos que la información de origen sea inmutable, pública y
              accesible para todos — desde la finca en Esmeraldas hasta la
              cafetería en Tokio.
            </p>
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link href="/track">Rastrear un Lote</Link>
              </Button>
              <Button asChild variant="ghost">
                <a
                  href="https://github.com/KRSNA-BLR/Pacha-Chain-Origin"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver en GitHub →
                </a>
              </Button>
            </div>
          </AnimateIn>
          <AnimateIn variants={slideInRight}>
            <div className="grid grid-cols-2 gap-4">
            {PILLARS.map((p) => (
              <Card key={p.title} className="text-center p-4">
                <div className="text-3xl mb-2">{p.icon}</div>
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
              </Card>
            ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      <Separator />

      {/* Wallets Compatibles */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <AnimateIn className="max-w-4xl mx-auto">
          <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              {/* Left: heading */}
              <div className="md:w-2/5 space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                  Wallets<br />Compatibles
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Conecta tu wallet preferida para interactuar con el sistema de
                  trazabilidad. Compatible con las principales wallets del
                  ecosistema EVM.
                </p>
              </div>

              {/* Right: wallet list */}
              <div className="md:w-3/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WALLETS.map((w) => (
                  <a
                    key={w.name}
                    href={w.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-4 rounded-xl bg-background/60 border border-transparent hover:border-primary/40 transition-all hover:bg-background"
                  >
                    <span className="text-3xl shrink-0 group-hover:scale-110 transition-transform">
                      {w.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{w.name}</p>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {w.desc}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </AnimateIn>
      </section>

      <Separator />

      {/* Tech Stack */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <AnimateIn className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Tecnología</h2>
        </AnimateIn>
        <StaggerGroup className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {TECH.map((t) => (
            <AnimateIn key={t.name} variants={scaleIn}>
              <div
                className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card text-center h-full"
              >
                <span className="text-2xl">{t.icon}</span>
                <span className="text-sm font-medium">{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.desc}</span>
              </div>
            </AnimateIn>
          ))}
        </StaggerGroup>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-green-900 to-green-800 text-white py-16">
        <AnimateIn className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para verificar tu producto?
          </h2>
          <p className="text-white/70 max-w-xl mx-auto mb-8">
            Escanea el código QR del empaque o ingresa el Batch ID para ver el
            journey completo de tu cacao o café ecuatoriano.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              <Link href="/verify">📱 Escanear QR</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Link href="/track">🔍 Rastrear Lote</Link>
            </Button>
          </div>
        </AnimateIn>
      </section>
    </div>
  );
}

const STATS = [
  { value: "6", label: "Estados verificados on-chain" },
  { value: "100%", label: "Trazabilidad inmutable" },
  { value: "ERC-1155", label: "Estándar de tokens" },
  { value: "IPFS", label: "Metadata descentralizada" },
];

const STEPS = [
  {
    icon: "🌱",
    title: "1. Registro On-Chain",
    description:
      "El agricultor registra el lote con datos de origen, variedad y coordenadas GPS. Se genera un token ERC-1155 único.",
  },
  {
    icon: "🔗",
    title: "2. Seguimiento Inmutable",
    description:
      "Cada actor de la cadena (procesador, exportador, comprador) avanza el estado del lote. Todo queda en la blockchain.",
  },
  {
    icon: "📱",
    title: "3. Verificación Pública",
    description:
      "Cualquier persona puede escanear el QR del producto y ver su journey completo: origen, proceso y certificaciones.",
  },
];

const STATES = [
  { icon: "🌱", label: "Cosechado", color: "bg-green-600", desc: "Registro del lote en finca" },
  { icon: "🫘", label: "Fermentado", color: "bg-amber-700", desc: "Proceso en centro de acopio" },
  { icon: "☀️", label: "Secado", color: "bg-yellow-600", desc: "Control de humedad y calidad" },
  { icon: "📦", label: "Empacado", color: "bg-blue-600", desc: "Preparación para exportación" },
  { icon: "🚢", label: "Enviado", color: "bg-indigo-600", desc: "En tránsito al destino" },
  { icon: "✅", label: "Entregado", color: "bg-emerald-600", desc: "Recibido por comprador" },
];

const WALLETS = [
  {
    icon: "🦊",
    name: "MetaMask",
    desc: "La wallet más popular del ecosistema Ethereum",
    url: "https://metamask.io",
  },
  {
    icon: "🔗",
    name: "WalletConnect",
    desc: "Conecta +400 wallets móviles y desktop",
    url: "https://walletconnect.com",
  },
  {
    icon: "🔵",
    name: "Coinbase Wallet",
    desc: "Wallet segura respaldada por Coinbase",
    url: "https://www.coinbase.com/wallet",
  },
  {
    icon: "🛡️",
    name: "Safe (Gnosis)",
    desc: "Multisig para organizaciones y DAOs",
    url: "https://safe.global",
  },
];

const TECH = [
  { icon: "⟠", name: "Polygon", desc: "Amoy Testnet" },
  { icon: "📦", name: "ERC-1155", desc: "Multi-token" },
  { icon: "🌐", name: "IPFS", desc: "Metadata descentralizada" },
  { icon: "🔐", name: "AccessControl", desc: "Roles on-chain" },
];

const PILLARS = [
  { icon: "🌍", title: "Transparencia", desc: "Datos públicos e inmutables" },
  { icon: "🤝", title: "Comercio Justo", desc: "Visibilidad para el farmer" },
  { icon: "🔒", title: "Seguridad", desc: "Controles de acceso on-chain" },
  { icon: "📱", title: "Accesibilidad", desc: "PWA desde cualquier dispositivo" },
];
