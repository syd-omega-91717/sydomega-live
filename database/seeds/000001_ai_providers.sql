INSERT INTO public.ai_providers
(code,name,model)

VALUES

('openai','OpenAI','gpt-5'),

('claude','Anthropic Claude','claude-opus-4'),

('gemini','Google Gemini','gemini-2.5-pro'),

('deepseek','DeepSeek','deepseek-chat'),

('ollama','Ollama','local'),

('openrouter','OpenRouter','auto')

ON CONFLICT (code)

DO NOTHING;
