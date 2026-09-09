# Workers

Os processadores assíncronos usam Celery com Redis. A base atual executa o
pipeline por etapas, registra cada trabalho no PostgreSQL, permite reiniciar de
uma etapa específica e sempre pausa em Revisão para aprovação humana.

Tarefas registradas:

- `darkfactory.process_pipeline`;
- `darkfactory.publish_content`.

Os adaptadores reais de pesquisa, roteiro, mídia, TTS e FFmpeg serão conectados
gradualmente dentro dessas etapas.
