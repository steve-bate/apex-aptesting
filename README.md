# apex-aptesting

Experimental extension of the [activitypub-testsuite](https://github.com/steve-bate/activitypub-testsuite) for testing [activitypub-express](https://github.com/immers-space/activitypub-express).

This repository contains activitypub-express test support code and configuration.

## Install

### Requirements

* MacOS or Linux
* Python 3.11+
* Node.js 16+

The project is currently configured to expect the `activitypub-testsuite` repository in a sibling directory. In the future, this may be modified to include `activitypub-testsuite` as a git submodule in the `apex-aptesting` testing repository.

### Set Up

1. Create a directory to hold the repositories, `testing`, for example, but the name doesn't matter.

2. Clone the `activitypub-testsuite` into that directory and install it.

```bash
git clone https://github.com/steve-bate/activitypub-testsuite.git
cd activitypub-testsuite/
poetry install
cd -
```

3. Clone the `apex-aptesting` repository into the `testing` directory (a sibling of the previous repository). *Note the special submodule-related argument to clone.*

```bash
git clone --recurse-submodules https://github.com/steve-bate/apex-aptesting
```


At this point, the directory structure should look similar to the following one.

```
testing
  ├── activitypub-testsuite
  ├── apex-aptesting
```

1. Change to the `apex-aptesting` directory and install it. This will do the Python (Poetry) install and run `npm init` in the `activitypub-express` submodule (the code being tested).

```
cd apex-aptesting
sh install.sh
```

## Usage

Run the tests from `apex-aptesting` directory. The tests will run in a Python virtual environment created by Poetry. You will need to run them using

```bash
poetry run pytest
```
or
```bash
poetry shell  # creates a shell configured with the virtual environment
pytest
```

## License

[MIT License](LICENSE.txt)
