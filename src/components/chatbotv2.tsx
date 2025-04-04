'use client';
/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/XOU1b6ruuyE
 */
import { Button } from '@/components/ui/button';
import { AvatarFallback, Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dispatch, SetStateAction, use, useEffect, useState } from 'react';
import { ConversationMessage } from './ui/ConversationMessage';
import { BotIcon } from './BotIcon';
import { PanelTopCloseIcon } from './PanelTopCloseIcon';
import { SendIcon } from './SendIcon';
import {
  QnA_ASSISTANT_ID,
  QnA_FILE_ID,
  createThread,
  createHighlightCompletions,
  pollRetrieveRun,
  postMessageAndRunThread,
  retrieveRun,
  sleep,
  getRecomendedArticles,
} from '@/api/assistantActions';
import { Thread } from 'openai/resources/beta/index.mjs';
import { getsummary } from '@/api/assistantActions';
import { ChatCompletion } from 'openai/resources/chat/completions.mjs';
import LoadingSpinner from './ui/LoadingSpinner';
import Link from 'next/link';

export enum User {
  User = 'User',
  Assistant = 'Assistant',
}

interface Article {
  id: number;
  title: string;
}

export interface Message {
  id: number;
  user: User;
  text: string;
}

interface Item {
  id: number;
  title: string;
  description: string;
  data: {
    created_at: string;
    content: string;
  };
}

export function Chatbotv2({ itemId, itemData }: { itemId: number; itemData: Item }) {
  const [inputValue, setInputValue] = useState('');
  const [conversation, setConversation] = useState<Conversation>([]);
  const [thread, setThread] = useState<Thread>();
  const [highlight, setHighlight] = useState<ChatCompletion>();
  const [articles, setArticles] = useState<Article[]>();
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const py = collapsed ? 'bottom-[-650px]' : 'bottom-4';

  useEffect(() => {
    if (thread) return;
    createThread().then((thread) => {
      setThread(thread);
    });
  }, [thread]);

  useEffect(() => {
    if (highlight) return;
    createHighlightCompletions(itemData.data.content).then((highlight) => {
      setHighlight(highlight.choices[0]);
    });
  }, [itemData.data.content, highlight]);

  useEffect(() => {
    if (articles) return;
    getRecomendedArticles(itemData.id.toString()).then((articleArray) => {
      setArticles(articleArray);
    });
  }, [itemData.id, articles]);

  // Message Runner
  useEffect(() => {
    if (conversation.length === 0 || !thread) return;
    const lastMessage = conversation[conversation.length - 1];
    if (lastMessage?.user !== User.User) return;

    // Summarize article flow
    if (lastMessage?.text === 'Can you summarize this article?') {
      setLoading(true);
      getsummary(itemData.data.content).then((summary) => {
        setLoading(false);
        setConversation((prev) => [
          ...prev,
          { id: prev.length + 1, user: User.Assistant, text: summary },
        ]);
      });
    }

    // Normal question and answer flow
    if (lastMessage?.text !== 'Can you summarize this article?') {
      setLoading(true);
      postMessageAndRunThread(thread.id, lastMessage.text, QnA_FILE_ID, QnA_ASSISTANT_ID).then(
        (runThreadRes) =>
          pollRetrieveRun(runThreadRes.thread_id, runThreadRes.id).then((message) => {
            setLoading(false);
            setConversation((prev) => [
              ...prev,
              { id: prev.length + 1, user: User.Assistant, text: message },
            ]);
          }),
      );
    }
  }, [conversation, setConversation, thread]);

  const handleOnSend = () => {
    if (!inputValue) return;
    setConversation((prev) => [
      ...prev,
      { id: prev.length + 1, user: User.User, text: inputValue },
    ]);
    setInputValue('');
  };

  const handleBookDemo = () => {
    setLoading(true);
    setConversation((prev) => [
      ...prev,
      { id: prev.length + 1, user: User.User, text: 'Book a demo' },
      {
        id: prev.length + 2,
        user: User.Assistant,
        text: 'I can definitley get you in touch with one of our Account Executives.',
      },
    ]);

    sleep(3000).then(() => {
      setConversation((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          user: User.Assistant,
          text: "I doesn't look like we have anyone available at the moment. Please provide your email and one of our reps will reach out to shortly!",
        },
      ]);
      setLoading(false);
    });
  };

  return (
    <div
      className={`fixed flex-col max-w-sm mx-auto p-4 bg-white rounded-lg shadow-lg min-w-[381.71px] min-h-[721.69px] ${py} right-4`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <BotIcon className="text-[#bd1e59]" />
        <Button className="text-[#bd1e59]" variant="ghost" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? 'Expand' : 'Collapse'}
        </Button>
        <Button className="text-[#bd1e59]" variant="ghost" onClick={() => setCollapsed(!collapsed)}>
          <PanelTopCloseIcon className="text-[#bd1e59]" />
        </Button>
      </div>
      {conversation.length === 0 ? (
        <WelcomeWindow
          articles={articles}
          conversation={conversation}
          setConversation={setConversation}
          highlight={highlight}
          handleBookDemo={handleBookDemo}
        />
      ) : (
        <ChatWindow conversation={conversation} setConversation={setConversation} />
      )}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <Input
          className="flex-1"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Start a conversation"
          type="text"
          disabled={loading}
        />
        <Button
          className="ml-2 bg-[#bd1e59] text-white"
          variant="secondary"
          onClick={() => handleOnSend()}
          disabled={loading}
        >
          {loading ? (
            <LoadingSpinner className={'text-white'} />
          ) : (
            <SendIcon className="text-white" />
          )}
        </Button>
      </div>
    </div>
  );
}

type Conversation = Message[];
interface ChatWindowProps {
  conversation: Conversation;
  setConversation: Dispatch<SetStateAction<Conversation>>;
}

function ChatWindow({ conversation, setConversation }: ChatWindowProps) {
  return (
    <main className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-4">
        {conversation.map((message) => (
          <ConversationMessage key={message.id} {...message} />
        ))}
      </div>
    </main>
  );
}

function WelcomeWindow({
  articles,
  conversation,
  setConversation,
  highlight,
  handleBookDemo,
}: {
  articles: Article[];
  conversation: Conversation;
  setConversation: Dispatch<SetStateAction<Conversation>>;
  highlight: ChatCompletion;
  handleBookDemo: () => void;
}) {
  const handleSummaryOnClick = () => {
    setConversation((prev) => [
      ...prev,
      { id: prev.length + 1, user: User.User, text: 'Can you summarize this article?' },
    ]);
  };

  return (
    <div className="py-4">
      <Avatar className="mx-auto mb-4 bg-[#bd1e59] text-black">
        <AvatarFallback>FL</AvatarFallback>
      </Avatar>
      <p className="text-center font-semibold mb-4">
        Hello! I&apos;m Flipbot, your personal AI companion.
      </p>
      <p className="text-center text-sm mb-4">
        I can help you explore and answer questions related to Uberflip
      </p>
      <div className="flex justify-between mb-4">
        <Button
          className="bg-[#bd1e59] text-white"
          variant="secondary"
          onClick={() => handleSummaryOnClick()}
        >
          Get a page summary
        </Button>
        <Button
          className="border-[#bd1e59] text-[#bd1e59]"
          variant="outline"
          onClick={() => handleBookDemo()}
        >
          Book a demo
        </Button>
      </div>
      <p className="font-semibold mb-2">These are the most important topics</p>
      <Highlights highlight={highlight} />
      <p className="font-semibold mb-2">Here&apos;s some related articles</p>
      <RecomendedArticles articles={articles} />
    </div>
  );
}

function Highlights(highlight) {
  if (!highlight.highlight) return <LoadingSpinner className={'text-[#bd1e59]'} />;

  const message = highlight.highlight.message;
  if (!message || !message.content) {
    return null;
  }

  const topics = message.content
    .split('\n')
    .map((topic) => topic.replace(/^\d+\.|\-\s*/, '').trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col space-y-2 mb-4">
      {topics.map((topic, index) => (
        <Button key={index} className="border-[#bd1e59] text-[#bd1e59]" variant="outline">
          {topic}
        </Button>
      ))}
    </div>
  );
}

interface RecomendedArticlesProps {
  articles: Article[];
}

function RecomendedArticles({ articles }: RecomendedArticlesProps) {
  if (!articles) return <LoadingSpinner className={'text-[#bd1e59]'} />;

  return (
    <div className="flex flex-col space-y-2 mb-4">
      {articles.map((article) => (
        <Link key={article.id} href={`/item/${article.id}`}>
          <Button className="border-[#bd1e59] text-[#bd1e59] w-full" variant="outline">
            {article.title.length > 40 ? article.title.substring(0, 40) + '...' : article.title}
          </Button>
        </Link>
      ))}
    </div>
  );
}
