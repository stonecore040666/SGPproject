import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { CollectionProvider } from '@/lib/store';
import { GachaPage } from '@/pages/GachaPage';
import { CollectionPage } from '@/pages/CollectionPage';
import { RatesPage } from '@/pages/RatesPage';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={GachaPage} />
      <Route path="/collection" component={CollectionPage} />
      <Route path="/rates" component={RatesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CollectionProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </CollectionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
