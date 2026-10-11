import React from "react";
import {
    LayoutDashboard,
    Scale,
    Truck,
    Users,
    Package,
    Ticket,
    LogOut,
} from "lucide-react";

const menuItems = [
    {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
    },
    {
        id: "pesee",
        label: "Weight Gate",
        icon: Scale,
    },
    {
        id: "camions",
        label: "Camions",
        icon: Truck,
    },
    {
        id: "chauffeurs",
        label: "Chauffeurs",
        icon: Users,
    },
    {
        id: "marchandises",
        label: "Marchandises",
        icon: Package,
    },
    {
        id: "tickets",
        label: "Tickets",
        icon: Ticket,
    },
];

export default function MarsaLayout({
    children,
    activePage = "pesee",
    onNavigate,
}) {
    const handleNavigate = (id) => {
        if (typeof onNavigate === "function") {
            onNavigate(id);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f7fb] text-slate-800 flex">
            {/* SIDEBAR */}
            <aside className="w-[250px] bg-[#0f172a] text-white flex flex-col fixed left-0 top-0 bottom-0 z-40">
                {/* LOGO */}
                <div className="h-[82px] flex items-center px-7 border-b border-white/10">
                    <div>
                        <div className="text-2xl font-black tracking-wide">
                            MIZAN
                        </div>

                        <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mt-1">
                            Port Weighing System
                        </div>
                    </div>
                </div>

                {/* NAVIGATION */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                            activePage === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() =>
                                    handleNavigate(item.id)
                                }
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${active
                                        ? "bg-white text-slate-900 shadow-lg"
                                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                <Icon
                                    size={19}
                                    strokeWidth={2}
                                />

                                <span>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* FOOTER */}
                <div className="p-4 border-t border-white/10">
                    <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:bg-white/10 hover:text-white transition"
                    >
                        <LogOut size={18} />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <main className="ml-[250px] min-h-screen flex-1">
                {/* TOP BAR */}
                <header className="h-[82px] bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Weight Gate
                        </h1>

                        <p className="text-xs text-slate-400 mt-1">
                            Gestion de la pesée des véhicules
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                            M
                        </div>

                        <div>
                            <p className="text-sm font-semibold">
                                Opérateur
                            </p>

                            <p className="text-xs text-slate-400">
                                Poste de pesée
                            </p>
                        </div>
                    </div>
                </header>

                {/* CONTENT */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}