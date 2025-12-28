import os


def should_ignore(file_name, ignore_exts):
    return any(file_name.endswith(f".{ext}") for ext in ignore_exts)


def should_include(name, includes):
    if not includes:
        return True
    return any(substr in name for substr in includes)


def should_exclude(name, excludes):
    if not excludes:
        return False
    return any(substr in name for substr in excludes)


def echo_all_files(
    base_dir=".",
    ignore_exts=None,
    ignore_dirs=None,
    output_file="all_code.txt",
    dir_name_includes=None,
    file_name_includes=None,
    exclude_files=None,
):
    if ignore_exts is None:
        ignore_exts = []
    if ignore_dirs is None:
        ignore_dirs = []
    if dir_name_includes is None:
        dir_name_includes = []
    if file_name_includes is None:
        file_name_includes = []
    if exclude_files is None:
        exclude_files = []

    with open(output_file, "w", encoding="utf-8") as out:
        for root, dirs, files in os.walk(base_dir):
            # Filter out ignored directories in-place
            dirs[:] = [d for d in dirs if d not in ignore_dirs]

            # Skip directory if its name doesn't match any of the includes (if set)
            if not should_include(os.path.basename(root), dir_name_includes):
                continue

            for file in files:
                if should_ignore(file, ignore_exts):
                    continue
                if should_exclude(file, exclude_files):
                    continue
                if not should_include(file, file_name_includes):
                    continue

                full_path = os.path.join(root, file)
                print(full_path)
                rel_path = os.path.relpath(full_path, base_dir)
                out.write(f"=== {rel_path} ===\n")
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        out.write(f.read())
                except Exception as e:
                    out.write(f"[ERROR reading file: {e}]\n")
                out.write("\n\n")


if __name__ == "__main__":
    echo_all_files(
        # BackEnd
        # r"C:\Users\יאיר דרור\OneDrive\שולחן העבודה\Full Stack\קורס של אורי\פרויקטים\project_3\BackEnd\src",

        # FrontEnd
        r"C:\Users\יאיר דרור\OneDrive\שולחן העבודה\Full Stack\קורס של אורי\פרויקטים\project_3\FrontEnd\src",

        ignore_exts=[
            # "css",
            # "js",
            # "jsx",
            "env",
            "gitignore",
            "woff",
            "json",
            "svg",
            "jpeg",
            "png",
            "jpg",

        ],
        # file_name_includes=["ilter"]
        exclude_files=["requirements", "ttd"],
        ignore_dirs=[
            "node_modules",
            "media",
            "models",
            "__pycache__",
            ".vscode",
            "venv",
            ".git",
            "migrations",
            "assets",
            "images",
            # "static",
            #  "providers"
        ],
        dir_name_includes=[],  # e.g., ['templates']

        # output_file="echo_BackEnd.txt",
        output_file="echo_FrontEnd.txt",
    )