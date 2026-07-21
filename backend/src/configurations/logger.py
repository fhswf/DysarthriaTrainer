import logging

from src.common.logging_utils.logger_protocol import ILogger


def configure_logger(name: str, lvl: str | int) -> ILogger:
    logger: logging.Logger = logging.getLogger(name)

    if logger.hasHandlers():
        logger.handlers.clear()

    logger.setLevel(lvl)

    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter(
            datefmt='%Y-%m-%d %H:%M:%S',
            fmt='[%(asctime)s] | %(levelname)-4s | %(name)s: %(message)s'
        )
    )
    logger.addHandler(handler)
    return logger
