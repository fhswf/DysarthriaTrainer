from abc import abstractmethod
from typing import Protocol, runtime_checkable, Mapping, Type
from types import TracebackType


@runtime_checkable
class ILogger(Protocol):

    @abstractmethod
    def debug(self,
              msg: object,
              *args: object,
              exc_info: None | bool | tuple[Type[BaseException], BaseException, TracebackType | None] | tuple[
                  None, None, None] | BaseException = None,
              stack_info: bool = False,
              stacklevel: int = 1,
              extra: Mapping[str, object] | None = None) -> None: ...

    @abstractmethod
    def info(self,
             msg: object,
             *args: object,
             exc_info: None | bool | tuple[Type[BaseException], BaseException, TracebackType | None] | tuple[
                 None, None, None] | BaseException = None,
             stack_info: bool = False,
             stacklevel: int = 1,
             extra: Mapping[str, object] | None = None) -> None: ...

    @abstractmethod
    def warning(self,
                msg: object,
                *args: object,
                exc_info: None | bool | tuple[Type[BaseException], BaseException, TracebackType | None] | tuple[
                    None, None, None] | BaseException = None,
                stack_info: bool = False,
                stacklevel: int = 1,
                extra: Mapping[str, object] | None = None) -> None: ...

    @abstractmethod
    def warn(self,
             msg: object,
             *args: object,
             exc_info: None | bool | tuple[Type[BaseException], BaseException, TracebackType | None] | tuple[
                 None, None, None] | BaseException = None,
             stack_info: bool = False,
             stacklevel: int = 1,
             extra: Mapping[str, object] | None = None) -> None: ...

    @abstractmethod
    def critical(self,
                 msg: object,
                 *args: object,
                 exc_info: None | bool | tuple[Type[BaseException], BaseException, TracebackType | None] | tuple[
                     None, None, None] | BaseException = None,
                 stack_info: bool = False,
                 stacklevel: int = 1,
                 extra: Mapping[str, object] | None = None) -> None: ...

    @abstractmethod
    def error(self,
              msg: object,
              *args: object,
              exc_info: None | bool | tuple[Type[BaseException], BaseException, TracebackType | None] | tuple[
                  None, None, None] | BaseException = None,
              stack_info: bool = False,
              stacklevel: int = 1,
              extra: Mapping[str, object] | None = None) -> None: ...

    @abstractmethod
    def exception(self,
                  msg: object,
                  *args: object,
                  exc_info: None | bool | tuple[Type[BaseException], BaseException, TracebackType | None] | tuple[
                      None, None, None] | BaseException = None,
                  stack_info: bool = False,
                  stacklevel: int = 1,
                  extra: Mapping[str, object] | None = None) -> None: ...
