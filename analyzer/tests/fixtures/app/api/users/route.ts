export async function GET() {
    return Response.json({
        message: "Users",
    });
}

export async function POST() {
    return Response.json({
        message: "User created",
    });
}