/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/Pxki3bhvygu
 */
interface Item {
  id: number;
  title: string;
  description: string;
  data: {
    created_at: string;
    content: string;
  };
}

export function Item({ itemId, itemData }: { itemId: number, itemData: Item }) {
  const item = itemData;

  return (
    <main className="px-4 py-6 md:px-6 md:py-12 lg:py-16 bg-gray-200">
        <article className="prose prose-gray max-w-6xl mx-auto dark:prose-invert">
          <div className="space-y-2 not-prose">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            {item.title}
            </h1>
            <p className="text-gray-500">{item.data.created_at}</p>
          </div>
          <div className="my-4 p-4 bg-gray-200 rounded-lg">
          <p className="text-gray-700">
            {item.description}
          </p>
        </div>
          <p></p>
          <div
            dangerouslySetInnerHTML={{ __html: item.data.content }}
            className="prose prose-gray dark:prose-invert"
          />
          <hr />
        </article>
    </main>
  );
};
