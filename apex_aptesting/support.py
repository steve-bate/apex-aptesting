from functools import lru_cache

from activitypub_testsuite.http.client import HttpxLocalActor, HttpxServerTestSupport
from activitypub_testsuite.http.token import HTTPTokenAuth
from activitypub_testsuite.interfaces import Actor


class ApexServerTestSupport(HttpxServerTestSupport):
    def __init__(self, local_base_url, remote_base_url, request):
        super().__init__(local_base_url, remote_base_url, request)

    @lru_cache
    def get_local_actor(self, actor_name: str = "local_actor_1") -> Actor:
        return ApexLocalActor(self, actor_name)


class ApexLocalActor(HttpxLocalActor):
    def __init__(self, server: HttpxServerTestSupport, actor_name: str):
        super().__init__(server, actor_name, auth=HTTPTokenAuth("TESTING"))

    def get_actor_uri(self, server, actor_name) -> str:
        return f"{server.local_base_url}/u/{actor_name}"
