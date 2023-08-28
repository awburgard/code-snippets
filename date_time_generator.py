import re
from datetime import datetime, tzinfo, timezone
from typing import Optional, Union

from faker.providers import BaseProvider

DateParseType = Union[datetime, str]

localized = True


def format_date(x: datetime):
    return x.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


default_start_date = format_date(datetime(1970, 1, 1, tzinfo=timezone.utc))
default_end_date = format_date(datetime.now(tz=timezone.utc))


class CustomDateTimeProvider(BaseProvider):
    __provider__ = "REDACTRED_date_time"
    """Implement custom date provider for Faker."""

    tz = timezone.utc
    start_date_default = default_start_date
    end_date_default = default_end_date
    zero_offset_indicator = re.compile('Z', re.IGNORECASE)

    def REDACTRED_date_time(
            self,
            tz: Optional[tzinfo] = timezone.utc,
            start_date: datetime = None,
            end_date: datetime = None,
    ) -> datetime:
        """
        Get a datetime timestamp for a date between January 1, 1970 and now, unless given a start and/or end date
        :param tz: timezone, instance of datetime.tzinfo subclass
        :param start_date: datetime(1970, 1,1)
        :param end_date: datetime(1970, 1,1)
        :example: datetime('2005-08-16 20:39:21')
        :return: datetime
        """

        start_stamp = start_date.timestamp()
        end_stamp = end_date.timestamp()

        diff = end_stamp - start_stamp

        offset = self.generator.random.random() * diff

        result = start_stamp + offset

        transform = datetime.fromtimestamp(result)

        return transform.replace(tzinfo=tz)

    def REDACTRED_date(self, pattern: str = "%Y-%m-%d",
                         start_date: str = start_date_default,
                         end_date: str = end_date_default) -> str:
        """
        Get a date string between January 1, 1970 and now unless given a start date and/or end date
        :param pattern: Format of the date (year-month-day by default) -- accepts strftime formats
        :param start_date: iso date string
        :param end_date: iso date string
        :example: '2008-11-27'
        :return: str
        """

        new_start_format = self._parse_date(start_date)
        end_date_format = self._parse_date(end_date)

        return self.REDACTRED_date_time(start_date=new_start_format, end_date=end_date_format).strftime(pattern)

    def REDACTRED_iso8601(
            self,
            start_date: str = start_date_default,
            end_date: str = end_date_default,
            sep: str = "T",
            timespec: str = "auto",
    ) -> str:
        """
        Get a timestamp in ISO 8601 format (or one of its profiles).
        :param start_date: iso date string
        :param end_date: iso date string
        :param sep: separator between date and time, defaults to 'T'
        :param timespec: format specifier for the time part, defaults to 'auto' - see datetime.isoformat() documentation
        :example: '2003-10-21T16:05:52+0000'
        """

        new_start_format = self._parse_date(start_date)
        end_date_format = self._parse_date(end_date)

        return self.REDACTRED_date_time(start_date=new_start_format, end_date=end_date_format).isoformat(sep,
                                                                                                           timespec)

    def REDACTRED_unix_time(
            self,
            start_date: str = start_date_default,
            end_date: str = end_date_default,
    ) -> int:
        """
        :param start_date: iso date string
        :param end_date: iso date string
        Get a timestamp between January 1, 1970 and now, unless passed
        explicit start_datetime or end_datetime values.
        :example: 1061306726
        """
        new_start_format = self._parse_date(start_date).timestamp()
        end_date_format = self._parse_date(end_date).timestamp()

        return self.generator.random.randint(new_start_format, end_date_format)

    @classmethod
    def _parse_date(cls, x: str) -> datetime:
        return datetime.fromisoformat(cls.zero_offset_indicator.sub('+00:00', x))
