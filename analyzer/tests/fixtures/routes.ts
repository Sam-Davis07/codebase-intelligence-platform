const router = {
    get: (...args: any[]) => {},
    post: (...args: any[]) => {},
};

function getUsers() {
    return [];
}

function createUser() {
    return {};
}

router.get("/users", getUsers);
router.post("/users", createUser);