import { Card, CardContent } from '@/components/ui/card';

const team = [
    {
        initials: 'AK',
        name: 'Arhan Karimi',
        role: 'Co-founder & CEO',
        bio: 'Former sales ops lead with 12 years experience scaling B2B teams across MENA & South Asia.',
    },
    {
        initials: 'SB',
        name: 'Sara Bilal',
        role: 'Co-founder & CTO',
        bio: 'Full-stack engineer and systems architect passionate about developer experience and platform reliability.',
    },
    {
        initials: 'RJ',
        name: 'Raza Javed',
        role: 'Head of Product',
        bio: 'Brings ten years of product thinking to transform customer needs into elegant CRM features.',
    },
    {
        initials: 'MF',
        name: 'Maha Farooq',
        role: 'Head of Design',
        bio: 'Crafts interfaces that feel intuitive from first click, balancing beauty with deep usability.',
    },
    {
        initials: 'TH',
        name: 'Tariq Hassan',
        role: 'Head of Customer Success',
        bio: 'Ensures every customer gets the most out of CRM Cup, from onboarding to advanced workflows.',
    },
    {
        initials: 'NA',
        name: 'Nadia Ahmed',
        role: 'Lead Engineer',
        bio: 'Architects the backend systems that keep CRM Cup fast, secure, and always available.',
    },
];

export default function TeamSection() {
    return (
        <section className="py-24 px-4 bg-sidebar">
            <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-16 space-y-4">
                    <p className="text-sm font-semibold tracking-[0.3em] text-white/60 uppercase">
                        The People
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold text-white">Meet the team</h2>
                    <p className="text-white/70 max-w-2xl mx-auto">
                        A diverse group of builders, designers, and customer advocates united by a shared love
                        of great software and great coffee.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {team.map(({ initials, name, role, bio }) => (
                        <Card
                            key={name}
                            className="bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors duration-300"
                        >
                            <CardContent className="p-6 flex flex-col items-start gap-4">
                                {/* Avatar */}
                                <div className="w-14 h-14 rounded-2xl bg-sidebar-accent/20 border border-sidebar-accent/30 flex items-center justify-center">
                                    <span className="text-sidebar-accent font-bold text-lg">{initials}</span>
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-base">{name}</p>
                                    <p className="text-sidebar-accent text-sm font-medium">{role}</p>
                                </div>
                                <p className="text-white/60 text-sm leading-relaxed">{bio}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
