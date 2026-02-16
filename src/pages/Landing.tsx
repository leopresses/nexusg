// Trecho da seção de planos dentro de src/pages/Landing.tsx
<section className="py-24 px-6 relative">
  <div className="container mx-auto">
    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto items-stretch">
      {SIMPLE_PLANS.map((plan, index) => (
        <motion.div
          key={index}
          variants={fadeInUp}
          whileHover={{ y: -8 }}
          className={`relative p-8 rounded-[32px] border bg-white flex flex-col transition-all duration-300
          ${
            plan.popular
              ? "border-blue-600 shadow-2xl shadow-blue-100 z-10 scale-105"
              : "border-slate-100 shadow-sm hover:border-blue-200"
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-blue-600 text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
              Recomendado
            </div>
          )}

          {/* Flex-1 garante que este espaço cresça e empurre o botão para baixo */}
          <div className="flex-1 text-center flex flex-col items-center">
            <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-tighter mb-6">{plan.clients}</p>

            <div className="mt-auto mb-8">
              <span className="text-3xl font-black text-slate-900 block">{plan.price}</span>
            </div>
          </div>

          <Link to="/register" className="w-full">
            <Button
              className={`w-full h-12 rounded-2xl font-bold transition-all ${
                plan.popular
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                  : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-100"
              }`}
            >
              Escolher Plano
            </Button>
          </Link>
        </motion.div>
      ))}
    </div>
  </div>
</section>;
