import json
import os
from typing import Any, Dict, List
from urllib import error, request


def _headers() -> Dict[str, str]:
    token = os.getenv("NOTION_TOKEN", "").strip()
    headers = {
        "Authorization": f"Bearer {token}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    }
    return headers


def _json_request(url: str, method: str = "GET", payload: Dict[str, Any] | None = None) -> Dict[str, Any]:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=data, headers=_headers(), method=method)
    with request.urlopen(req, timeout=20) as resp:
        body = resp.read().decode("utf-8")
        if not body:
            return {}
        return json.loads(body)


def verify_connection() -> Dict[str, Any]:
    token = os.getenv("NOTION_TOKEN", "").strip()
    db_id = os.getenv("NOTION_DATABASE_ID", "").strip()
    has_token = bool(token)
    has_db = bool(db_id)

    if not has_token or not has_db:
        return {
            "connected": False,
            "hasToken": has_token,
            "hasDatabaseId": has_db,
            "error": "Notion credentials are missing.",
        }

    try:
        data = _json_request(f"https://api.notion.com/v1/databases/{db_id}")
        title = "Notion Workspace"
        if isinstance(data, dict):
            title_parts = data.get("title") or []
            if title_parts:
                title = title_parts[0].get("plain_text") or title_parts[0].get("text", {}).get("content") or title
        return {
            "connected": True,
            "hasToken": True,
            "hasDatabaseId": True,
            "workspaceName": title,
            "error": None,
        }
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        return {
            "connected": False,
            "hasToken": True,
            "hasDatabaseId": True,
            "error": detail or str(exc),
        }
    except Exception as exc:  # pragma: no cover - network diagnostics path
        return {
            "connected": False,
            "hasToken": True,
            "hasDatabaseId": True,
            "error": str(exc),
        }


def list_tasks() -> List[Dict[str, Any]]:
    token = os.getenv("NOTION_TOKEN", "").strip()
    db_id = os.getenv("NOTION_DATABASE_ID", "").strip()
    if not token or not db_id:
        return []

    try:
        data = _json_request(f"https://api.notion.com/v1/databases/{db_id}/query", method="POST", payload={})
        pages = data.get("results", [])
        tasks: List[Dict[str, Any]] = []
        for page in pages:
            props = page.get("properties", {})

            title_value = props.get("Name") or props.get("Title") or props.get("Task") or {}
            title = "Untitled Task"
            if title_value.get("title"):
                title = title_value["title"][0].get("plain_text") or title_value["title"][0].get("text", {}).get("content") or title

            status_value = props.get("Status") or props.get("State") or {}
            status = status_value.get("status", {}).get("name") or status_value.get("select", {}).get("name") or "To do"

            priority_value = props.get("Priority") or {}
            priority = priority_value.get("select", {}).get("name") or "Medium"

            tasks.append({
                "id": page.get("id"),
                "title": title,
                "status": status,
                "priority": priority,
                "project": "Notion",
                "date": "Today",
            })
        return tasks
    except Exception:
        return []


def create_task(title: str, status: str = "To do", priority: str = "Medium") -> Dict[str, Any]:
    token = os.getenv("NOTION_TOKEN", "").strip()
    db_id = os.getenv("NOTION_DATABASE_ID", "").strip()
    if not token or not db_id:
        return {"id": None, "title": title, "status": status, "priority": priority}

    payload = {
        "parent": {"database_id": db_id},
        "properties": {
            "Name": {"title": [{"text": {"content": title}}]},
            "Status": {"status": {"name": status}},
            "Priority": {"select": {"name": priority}},
        },
    }
    try:
        data = _json_request("https://api.notion.com/v1/pages", method="POST", payload=payload)
        return {
            "id": data.get("id"),
            "title": title,
            "status": status,
            "priority": priority,
        }
    except Exception:
        return {"id": None, "title": title, "status": status, "priority": priority}


def update_task(page_id: str, status: str | None = None, priority: str | None = None) -> Dict[str, Any]:
    token = os.getenv("NOTION_TOKEN", "").strip()
    if not token or not page_id:
        return {"ok": False, "page_id": page_id}

    payload: Dict[str, Any] = {"properties": {}}
    if status:
        payload["properties"]["Status"] = {"status": {"name": status}}
    if priority:
        payload["properties"]["Priority"] = {"select": {"name": priority}}

    try:
        _json_request(f"https://api.notion.com/v1/pages/{page_id}", method="PATCH", payload=payload)
        return {"ok": True, "page_id": page_id, "status": status, "priority": priority}
    except Exception:
        return {"ok": False, "page_id": page_id}


def delete_task(page_id: str) -> Dict[str, Any]:
    token = os.getenv("NOTION_TOKEN", "").strip()
    if not token or not page_id:
        return {"ok": False, "page_id": page_id}

    try:
        _json_request(f"https://api.notion.com/v1/pages/{page_id}", method="PATCH", payload={"archived": True})
        return {"ok": True, "deleted": page_id}
    except Exception:
        return {"ok": False, "page_id": page_id}
