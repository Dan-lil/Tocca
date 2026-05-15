
// export default function HomePage() {
//   return (
//     <div>page</div>
//   )
// }

import NotFoundPage from '@/app/NotFoundPage/not-found';

export default function Home() {
  // Временно показываем страницу 404 на главной
  return <NotFoundPage />;
}