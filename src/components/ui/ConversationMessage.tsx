import { Message, User } from '../chatbot';

export function ConversationMessage({ user, text }: Message) {
  switch (user) {
    case User.User:
      return (
        <div className="flex items-start gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">{user}</div>
            <div className="text-sm text-gray-500">{text}</div>
          </div>
        </div>
      );
    case User.Assistant:
      return (
        <div className="flex items-start gap-2 ml-auto">
          <div className="flex flex-col gap-1 text-right">
            <div className="text-sm font-medium">{user}</div>
            <div className="text-sm text-gray-500">{text}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-200" />
        </div>
      );
  }
}
