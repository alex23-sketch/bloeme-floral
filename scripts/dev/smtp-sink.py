"""Minimal local SMTP sink for development acceptance testing.
Receives messages on 127.0.0.1:1025 and writes .eml files to a temp directory.
Not used in production or shipped packages.
"""
from datetime import datetime
from pathlib import Path
import sys

from aiosmtpd.controller import Controller

OUT = Path(__import__('tempfile').gettempdir()) / 'bloeme-smtp-sink'
OUT.mkdir(exist_ok=True)


class Handler:
    async def handle_DATA(self, server, session, envelope):
        path = OUT / f"msg-{datetime.now().strftime('%Y%m%d-%H%M%S-%f')}.eml"
        data = envelope.content if hasattr(envelope, 'content') else envelope.original_content
        if isinstance(data, str):
            data = data.encode()
        path.write_bytes(data)
        print(f"RECEIVED {envelope.mail_from} -> {envelope.rcpt_tos} {path}", file=sys.stderr, flush=True)
        return '250 OK'


if __name__ == '__main__':
    Controller(Handler(), hostname='127.0.0.1', port=1025).start()
    print('SMTP sink listening on 127.0.0.1:1025', flush=True)
    try:
        import asyncio
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        pass
