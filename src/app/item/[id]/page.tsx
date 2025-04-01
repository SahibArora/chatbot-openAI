import { Item } from '../../../components/item';
import { Chatbotv2 } from '@/components/chatbotv2';
import jsonData from '@/data/itemsv2.json';

const ItemPage = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const itemId = parseInt(id, 10);

  if (itemId > 53 || itemId <= 0 ) {
    return (
      <main className="px-4 py-6 md:px-6 md:py-12 lg:py-16">
        <article className="prose prose-gray max-w-6xl mx-auto dark:prose-invert">
         <div className="space-y-2 not-prose">
           <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Item Not Found
           </h1>
           <h2>Please Try with a valid Item ID (1-53)</h2>
         </div>
        </article>
      </main>
    );
  } else {
    const itemData = jsonData.data[itemId - 1];
    return (
      <div className="relative">
        <Item itemId={itemId} itemData={itemData} />
        <Chatbotv2 itemId={itemId} itemData={itemData} />
      </div>
    );
  }
};

export default ItemPage;
