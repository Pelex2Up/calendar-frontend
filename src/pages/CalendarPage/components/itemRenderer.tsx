import moment from "moment";
import { TimelineProps } from "types/common";
import emojiRegex from "emoji-regex";

type TextPart = {
  type: "text";
  content: string;
};

type EmojiPart = {
  type: "emoji";
  content: string;
};

type Part = TextPart | EmojiPart;

export const itemRenderer: TimelineProps["itemRenderer"] = (props) => {
  const { item, itemContext, getItemProps, getResizeProps } = props;
  const { right: rightResizeProps } = getResizeProps();

  const parseText = (text: string): Part[] => {
    const regex = emojiRegex();
    const parts: Part[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Добавляем текст до эмодзи
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        });
      }
      // Добавляем эмодзи
      parts.push({ type: "emoji", content: match[0] });
      lastIndex = match.index + match[0].length;
    }

    // Добавляем оставшийся текст
    if (lastIndex < text.length) {
      parts.push({ type: "text", content: text.slice(lastIndex) });
    }

    return parts;
  };

  // Парсим текст
  const name = parseText(itemContext.title);

  return (
    <div
      data-tooltip-id={item.breakTime ? "" : "my-tooltip"}
      data-tooltip-html={`<div><h3>${item.title}</h3><h5>${
        item.description
      }</h5>
      <h5>${item.optionalComment || ""}</h5><ul><li>Начало: ${
        itemContext.dragTime
          ? `${String(moment(itemContext.dragTime).hours()).padStart(
              2,
              "0"
            )}:${String(moment(itemContext.dragTime).minutes()).padStart(
              2,
              "0"
            )}`
          : `${String(moment(item.start_time).hours()).padStart(
              2,
              "0"
            )}:${String(moment(item.start_time).minutes()).padStart(2, "0")}`
      }</li>
        <li>Конец: ${
          itemContext.dragTime
            ? `${String(
                moment(
                  itemContext.dragTime + itemContext.dimensions.collisionWidth
                ).hours()
              ).padStart(2, "0")}:${String(
                moment(
                  itemContext.dragTime + itemContext.dimensions.collisionWidth
                ).minutes()
              ).padStart(2, "0")}`
            : `${String(moment(item.end_time).hours()).padStart(
                2,
                "0"
              )}:${String(moment(item.end_time).minutes()).padStart(2, "0")}`
        }</li>
        </ul>
        </div>`}
      data-tooltip-place="right"
      data-tooltip-delay-show={600}
      onMouseEnter={(e) => {
        e.currentTarget.removeAttribute("title");
      }}
      {...getItemProps(
        itemContext.selected
          ? {
              style: {
                background: item.breakTime
                  ? `repeating-linear-gradient(45deg, ${item.bgColor},${item.bgColor} 10px, transparent 10px, transparent 20px)`
                  : `${item.bgColor}`,
                color: item.color,
                borderColor: item.breakTime ? item.selectedBgColor : "red",
                borderStyle: "solid",
                borderRadius: item.breakTime ? 0 : 4,
                borderWidth: `${item.breakTime ? "1px 5px" : "1px"}`,
              },
            }
          : {
              style: {
                background: item.breakTime
                  ? `repeating-linear-gradient(45deg, ${item.bgColor},${item.bgColor} 10px, transparent 10px, transparent 20px)`
                  : `${item.bgColor}`,
                color: item.color,
                borderRadius: item.breakTime ? 0 : 4,
                borderWidth: `1px`,
                borderStyle: "solid",
                borderColor: `${item.breakTime ? item.bgColor : item.color}`,
              },
            }
      )}
    >
      {itemContext.canResizeLeft &&
        itemContext.canResizeRight &&
        itemContext.selected && (
          <>
            <div className="left-handle" />
            <div className="right-handle" />
          </>
        )}
      <div
        style={{
          height: itemContext.dimensions.height,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "10px 5px",
          position: "relative",
          width: itemContext.dimensions.width,
          lineHeight: 0,
        }}
      >
        <div
          style={{
            height: itemContext.dimensions.height,
          }}
        >
          <p
            style={{
              height: itemContext.dimensions.height,
              minHeight: itemContext.dimensions.height / 2,
              // width: `calc(${itemContext.dimensions.height}px - 10px)`,
              display: "flex",
              justifyContent: "center",
              gap: "3px",
              overflow: "hidden",
              textAlign: "center",
              color: item.isLocked ? "#ffffff" : "#000000",
              fontWeight: "bold",
              padding: "10px",
              fontSize: "18px",
              margin: 0,
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: `20px`,
            }}
          >
            {item.breakTime
              ? ""
              : name.map((part, index) => {
                  if (part.type === "emoji") {
                    return (
                      <span key={index} className={"emoji"}>
                        {part.content}
                      </span>
                    );
                  } else if (part.type === "text") {
                    return (
                      <span key={index} className={"text"}>
                        {part.content}
                      </span>
                    );
                  }
                })}
          </p>
        </div>
        <div
          style={{
            height: itemContext.dimensions.height,
          }}
        >
          <span
            style={{
              height: itemContext.dimensions.height,
              // width: `calc(${itemContext.dimensions.height}px - 20px)`,
              minHeight: itemContext.dimensions.height / 2,
              display: "inline-block",
              padding: "10px 0",
              margin: 0,
              overflow: "hidden",
              color: item.isLocked ? "#ffffff" : "#000000",
              fontWeight: "600",
              textAlign: "center",
              textOverflow: "ellipsis",
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
              whiteSpace: "wrap",
              lineHeight: itemContext.dimensions.width > 100 ? `20px` : 0,
            }}
          >
            {itemContext.dimensions.width > 100 &&
            item.description &&
            !item.breakTime
              ? item.description
              : ""}
          </span>
        </div>
      </div>

      {itemContext.useResizeHandle ? <div {...rightResizeProps} /> : null}
    </div>
  );
};
