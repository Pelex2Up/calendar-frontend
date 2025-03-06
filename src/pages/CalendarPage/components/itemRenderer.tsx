import moment from "moment";
import { TimelineProps } from "types/common";

export const itemRenderer: TimelineProps["itemRenderer"] = (props) => {
  const { item, itemContext, getItemProps, getResizeProps } = props;
  const { right: rightResizeProps } = getResizeProps();
  return (
    <div
      data-tooltip-id={item.breakTime ? "" : "my-tooltip"}
      data-tooltip-html={`<div><h3>${item.title}</h3><h5>${
        item.description
      }</h5><ul><li>Начало: ${
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
          flexDirection: "column",
          alignItems: "center",
          // lineHeight: itemContext.dimensions.height / 3,
        }}
      >
        <p
          style={{
            maxWidth: "100%",
            display: "block",
            overflow: "hidden",
            padding: "0 10px",
            margin: "0 auto",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: `${itemContext.dimensions.height / 2}px `,
          }}
        >
          {item.breakTime ? "" : itemContext.title}
        </p>
        <p
          style={{
            maxWidth: "100%",
            display: "block",
            overflow: "hidden",
            margin: "0 auto",
            padding: "0 10px",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: `${itemContext.dimensions.height / 2}px `,
            // height: itemContext.dimensions.height / 2,
          }}
        >
          {item.description && !item.breakTime ? item.description : ""}
        </p>
      </div>

      {itemContext.useResizeHandle ? <div {...rightResizeProps} /> : null}
    </div>
  );
};
