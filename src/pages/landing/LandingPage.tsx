import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SSLBadge } from "@/components/common/SSLBadge";
import { 
  Calendar, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Shield, 
  Star,
  Check,
  ArrowRight,
  Play,
  Heart,
  Clock,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProductsCache } from "@/contexts/ProductsCacheContext";
import { useAuth } from "@/contexts/AuthContext";

export function LandingPage() {
  const navigate = useNavigate();
  const { products, loading } = useProductsCache();
  const { user, setRedirectTo } = useAuth();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handlePayment = (planId: string) => {
    // Se usuário está logado, vai direto para pagamento
    if (user) {
      console.log('✅ Usuário logado, indo direto para pagamento:', planId);
      navigate(`/payment?plan=${planId}`);
    } else {
      // Se não está logado, armazena a intenção e vai para login
      const redirectPath = `/payment?plan=${planId}`;
      console.log('👤 Usuário não logado, armazenando intenção de compra:', redirectPath);
      setRedirectTo(redirectPath);
      
      // Verificar se foi salvo corretamente
      setTimeout(() => {
        const saved = localStorage.getItem('auth_redirect_to');
        console.log('🔍 Verificando se redirectTo foi salvo no localStorage:', saved);
      }, 100);
      
      navigate('/login');
    }
  };

  const features = [
    {
      icon: Calendar,
      title: "Agenda Inteligente",
      description: "Gerencie agendamentos com recorrência, lembretes automáticos e confirmações via WhatsApp."
    },
    {
      icon: Users,
      title: "Gestão de Pacientes",
      description: "Prontuários digitais completos, histórico médico e acompanhamento de evolução."
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Integrado",
      description: "Confirmações automáticas, lembretes e comunicação direta com pacientes."
    },
    {
      icon: BarChart3,
      title: "Relatórios Avançados",
      description: "Dashboard com métricas, relatórios financeiros e análises de performance."
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Dados protegidos com criptografia e backup automático na nuvem."
    },
    {
      icon: Heart,
      title: "Foco no Cuidado",
      description: "Mais tempo para seus pacientes, menos tempo com burocracia."
    }
  ];

  const testimonials = [
    {
      name: "Dr. Maria Silva",
      role: "Fisioterapeuta",
      content: "O GoPhysioTech revolucionou minha clínica! Economizo 3 horas por dia só com a automação do WhatsApp.",
      rating: 5
    },
    {
      name: "Clínica MoviMais",
      role: "Rede de Fisioterapia",
      content: "Desde que adotamos o sistema, nossa taxa de comparecimento aumentou 40% e o faturamento 60%.",
      rating: 5
    },
    {
      name: "João Santos",
      role: "Administrador",
      content: "Interface intuitiva e suporte excepcional. Nossos fisioterapeutas se adaptaram rapidamente.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center p-1">
              <img src="/favicon.ico" alt="GoPhysioTech Logo" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              GoPhysioTech
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={handleLogin}
              className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              Entrar
            </Button>
            <Button 
              onClick={handleSignUp}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
            <Zap className="w-4 h-4 mr-2" />
            Sistema de Gestão para Clínicas de Fisioterapia
          </Badge>
          <h2 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Transforme sua
            <br />
            <span className="text-slate-800">Clínica de Fisioterapia</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Automatize agendamentos, gerencie pacientes e aumente seu faturamento com o sistema mais completo do mercado. 
            <strong className="text-blue-600"> WhatsApp integrado</strong> e <strong className="text-blue-600">relatórios inteligentes</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => handlePayment('professional')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl"
            >
              Assinar Professional
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleSignUp}
              className="border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 px-8 py-4 text-lg hover:scale-105 transition-all duration-200"
            >
              <Play className="w-5 h-5 mr-2" />
              Ver Demonstração
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            <Clock className="w-4 h-4 inline mr-1" />
            14 dias grátis • Sem cartão de crédito • Suporte incluído
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4 text-slate-800">
              Tudo que sua clínica precisa
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Recursos pensados especificamente para fisioterapeutas que querem focar no que importa: cuidar dos pacientes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-md">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold mb-4 text-slate-800">{feature.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4 text-slate-800">
              Planos para cada necessidade
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Escolha o plano ideal para sua clínica. Todos incluem suporte e atualizações gratuitas.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {loading ? (
              // Loading state
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="border-0 shadow-lg animate-pulse">
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <div className="h-8 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-6"></div>
                      <div className="h-12 bg-gray-200 rounded mb-6"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              products.map((plan, index) => (
                <Card key={plan.id} className={`relative hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''} border-0 shadow-lg`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1">
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <h4 className="text-2xl font-bold text-slate-800 mb-2">{plan.name}</h4>
                      <p className="text-gray-600 mb-4">{plan.description}</p>
                      <div className="flex items-baseline justify-center mb-6">
                        <span className="text-5xl font-bold text-slate-800">R$ {plan.price}</span>
                        <span className="text-gray-500 ml-1">{plan.period}</span>
                      </div>
                      <Button 
                      className={`w-full py-3 text-lg transition-all duration-200 ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:scale-105 shadow-lg hover:shadow-xl' 
                          : 'border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 hover:scale-105'
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handlePayment(plan.id)}
                    >
                      Assinar Agora
                    </Button>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4 text-slate-800">
              Nossos clientes recomendam
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Veja o que fisioterapeutas e clínicas estão dizendo sobre o GoPhysioTech.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-md">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-slate-800">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="container mx-auto text-center text-white">
          <h3 className="text-4xl font-bold mb-6">
            Pronto para transformar sua clínica?
          </h3>
          <p className="text-xl mb-12 max-w-2xl mx-auto opacity-90">
            Junte-se a centenas de fisioterapeutas que já automatizaram sua gestão e aumentaram o faturamento.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => handlePayment('professional')}
              className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 text-lg hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl"
            >
              Assinar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleLogin}
              className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg hover:scale-105 transition-all duration-200"
            >
              Já tenho conta
            </Button>
          </div>
          <p className="text-sm opacity-75 mt-6">
            <Clock className="w-4 h-4 inline mr-1" />
            Configuração em menos de 5 minutos
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center p-1">
              <img src="/favicon.ico" alt="GoPhysioTech Logo" className="w-6 h-6 object-contain" />
            </div>
            <h1 className="text-xl font-bold">GoPhysioTech</h1>
          </div>
          <p className="text-gray-400 mb-6">
            O sistema de gestão mais completo para clínicas de fisioterapia.
          </p>
          
          {/* SSL Badge */}
          <div className="flex justify-center mb-6">
            <SSLBadge variant="default" />
          </div>
          
          <div className="flex justify-center space-x-8 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Suporte</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>
          <p className="text-gray-500 text-sm mt-6">
            © 2025 GoPhysioTech. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}