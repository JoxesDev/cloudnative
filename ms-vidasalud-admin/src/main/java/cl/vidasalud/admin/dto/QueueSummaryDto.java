package cl.vidasalud.admin.dto;

public class QueueSummaryDto {

    private String name;
    private boolean durable;
    private boolean exclusive;
    private boolean autoDelete;
    private Integer messageCount;
    private Integer consumerCount;
    private boolean dlq;

    public QueueSummaryDto() {}

    public QueueSummaryDto(String name, boolean durable, boolean exclusive, boolean autoDelete,
                           Integer messageCount, Integer consumerCount, boolean dlq) {
        this.name = name;
        this.durable = durable;
        this.exclusive = exclusive;
        this.autoDelete = autoDelete;
        this.messageCount = messageCount;
        this.consumerCount = consumerCount;
        this.dlq = dlq;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isDurable() {
        return durable;
    }

    public void setDurable(boolean durable) {
        this.durable = durable;
    }

    public boolean isExclusive() {
        return exclusive;
    }

    public void setExclusive(boolean exclusive) {
        this.exclusive = exclusive;
    }

    public boolean isAutoDelete() {
        return autoDelete;
    }

    public void setAutoDelete(boolean autoDelete) {
        this.autoDelete = autoDelete;
    }

    public Integer getMessageCount() {
        return messageCount;
    }

    public void setMessageCount(Integer messageCount) {
        this.messageCount = messageCount;
    }

    public Integer getConsumerCount() {
        return consumerCount;
    }

    public void setConsumerCount(Integer consumerCount) {
        this.consumerCount = consumerCount;
    }

    public boolean isDlq() {
        return dlq;
    }

    public void setDlq(boolean dlq) {
        this.dlq = dlq;
    }
}
