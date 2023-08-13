import os

import httpx
import pytest
from activitypub_testsuite.fixtures import *  # noqa
from activitypub_testsuite.interfaces import ServerTestSupport

from apex_aptesting.support import ApexServerTestSupport


@pytest.fixture(scope="session")
def server_test_directory():
    return os.path.dirname(__file__)


@pytest.fixture
def server_support(local_base_url, remote_base_url, request) -> ServerTestSupport:
    return ApexServerTestSupport(local_base_url, remote_base_url, request)


@pytest.fixture(scope="session")
def server_subprocess_config(
    server_test_directory, local_server_port
) -> ServerSubprocessConfig:  # noqa: F405
    return ServerSubprocessConfig(  # noqa: F405
        args=["node", "index.js", str(local_server_port)],
        cwd=os.path.join(server_test_directory, "app"),
    )


@pytest.fixture(autouse=True)
def reset_server_store(local_base_url):
    response = httpx.get(f"{local_base_url}/test/reset", timeout=None, verify=False)
    response.raise_for_status()


def pytest_configure():
    pkg_dir = os.path.dirname(os.path.realpath(__file__))
    install_fedi_tests(os.path.join(pkg_dir, "tests"))  # noqa: F405
