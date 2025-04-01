import { OpenAI } from 'openai';
import { Thread } from 'openai/resources/beta/index.mjs';
import { MessageContentText, Run } from 'openai/resources/beta/threads/index.mjs';
import jsonData from '@/data/itemTitles.json';

const OPEN_AI_KEY = process.env.NEXT_PUBLIC_OPEN_AI_KEY;
export const RECOBOT_FILE_ID = 'file-Z9XGupFoNLVHGy1BjfRUQxfo';
export const RECOBOT_ASSISTANT_ID = 'asst_8QjjIy4SyudkW6wjd7AuqrEV';
export const QnA_FILE_ID = 'file-qB5L5XpCQNfLpHXZdNmo3KHY';
export const QnA_ASSISTANT_ID = 'asst_wH7MgohQoCtpR1GQQdDXpd5h';

const openai = new OpenAI({ apiKey: OPEN_AI_KEY, dangerouslyAllowBrowser: true });

export async function createThread() {
  return openai.beta.threads.create();
}

export async function postMessage(threadId: Thread['id'], message: string, fileId: string) {
  const threadMessages = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: message,
    file_ids: [fileId],
  });
  return threadMessages;
}

export async function runThread(threadId: Thread['id'], assistantId: string) {
  return openai.beta.threads.runs.create(threadId, { assistant_id: assistantId });
}

export async function postMessageAndRunThread(
  threadId: Thread['id'],
  message: string,
  fileId: string,
  assistantId: string,
) {
  const response = await postMessage(threadId, message, fileId);
  return runThread(response.thread_id, assistantId);
}

export async function retrieveRun(threadId: Thread['id'], runId: Run['id']) {
  const run = await openai.beta.threads.runs.retrieve(threadId, runId);
  return run;
}

export async function getMessages(threadId: Thread['id']) {
  const messages = await openai.beta.threads.messages.list(threadId);
  return messages;
}

export async function getRecomendedArticles(itemId: string) {
  const thread = await createThread();
  const runThreadRes = await postMessageAndRunThread(
    thread.id,
    `Return a list of 2 items from the attached file "itemsTitles.json" that would be most helpful to a user reading item ${itemId}. the output should be in the format: [{ "id": id 1, "title": title 1}, {"id": id 2, "title": title 2}]`,
    RECOBOT_FILE_ID,
    RECOBOT_ASSISTANT_ID,
  );
  const message = await pollRetrieveRun(runThreadRes.thread_id, runThreadRes.id);
  try {
    const arr = message.match(/(\{.+\})/gm)
    if (arr?.length !== 2) throw new Error('failed')
    return arr?.map((obj) => JSON.parse(obj));
  } catch (e) {
    const dataLength = jsonData.data.length - 1 
    const items = [
      jsonData.data[Math.floor(Math.random() * dataLength)],
      jsonData.data[Math.floor(Math.random() * dataLength)],
    ]
    return items.map((item) => ({ id: item.id, title: item.title }));
  }
}

export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Polls the run until it is complete and returns the message
export async function pollRetrieveRun(threadId: string, runId: string) {
  let polling = true;
  while (polling) {
    const res = await retrieveRun(threadId, runId);
    console.log(res.status);
    if (res.status === 'in_progress') {
      await sleep(2500);
    } else {
      polling = false;
    }
  }

  const messageList = await getMessages(threadId);
  const content = messageList.data[0].content[0] as MessageContentText;
  return content.text.value;
}

export async function createHighlightCompletions(inputText: string) {
  const filteredText = removeHtmlTags(inputText).trim().substring(0, 4097); // max length for GPT-3.5;

  return await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'Provide 3 top most important topics from the following text. Each topic should be a short phase, in less than 5 words.',
      },
      { role: 'system', content: filteredText },
    ],
    model: 'gpt-3.5-turbo',
    max_tokens: 150, // Adjust the max_tokens parameter based on your desired summary length
    temperature: 0.5, // Adjust the temperature parameter for different levels of randomness
  });
}

export async function getsummary(inputText: string) {
  const filteredText = removeHtmlTags(inputText).trim().substring(0, 4097); // max length for GPT-3.5;

  const summaryResponse = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Summarize the following article in less than 50 words.',
      },
      {
        role: 'system',
        content: filteredText, // max length for GPT-3.5
      },
    ],
    model: 'gpt-3.5-turbo',
    // max_tokens: , // Adjust the max_tokens parameter based on your desired summary length
    temperature: 0.5, // Adjust the temperature parameter for different levels of randomness
  });

  const message = await summaryResponse.choices[0].message.content;

  return message ?? 'Issue getting the page summary';
}

export const chunkText = (text: string, chunkSize: number) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
};

export function removeHtmlTags(input: string) {
  return input.replace(/<[^>]*>/g, '');
}
