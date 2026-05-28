import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { BrandSection, HeroSection } from './design-system/Hero';
import { ColorSection, TypeSection } from './design-system/Foundations';
import { ComponentsSection } from './design-system/Components';
import { LearningSection } from './design-system/Learning';

/**
 * Capuchino — Design System showcase page.
 *
 * Route this in routes/web.php with:
 *   Route::get('/design', fn () => Inertia::render('DesignSystem'))->name('design-system');
 */
export default function DesignSystem() {
    return (
        <AppLayout
            navLinks={[
                { label: 'Brand', href: '#brand' },
                { label: 'Foundations', href: '#foundations' },
                { label: 'Components', href: '#components' },
                { label: 'Learning', href: '#learning' },
            ]}
        >
            <Head title="Design system" />
            <HeroSection />
            <BrandSection />
            <ColorSection />
            <TypeSection />
            <ComponentsSection />
            <LearningSection />
        </AppLayout>
    );
}
